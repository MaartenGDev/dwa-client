import React, {FC} from 'react';
import styled from "styled-components";
import {Link} from "react-router-dom";
import {connect, ConnectedProps} from "react-redux";
import {RootState} from "../../store/rootReducer";
import {RoundedButtonLink} from "../Styling/Buttons";
import {Row, Title} from "../Styling/Common";

const Content = styled.div`
  background-color: #ffffff;
`


const TableLink = styled(Link)`
  color: #4A92E6;
  text-transform: uppercase;
  text-decoration: none;
`;




const mapState = (state: RootState) => ({
    retrospectives: state.retrospectiveReducer.retrospectives,
    teams: state.teamReducer.teams,
});

const connector = connect(mapState)
type PropsFromRedux = ConnectedProps<typeof connector>

const Retrospectives: FC<PropsFromRedux> = ({retrospectives, teams}) => {
    const canCreateRetrospective = teams.length > 0;

    return (
        <main>
            <Row>
                <Title>Retrospectives</Title>
                {canCreateRetrospective && <RoundedButtonLink to='/retrospectives/create'>Create</RoundedButtonLink>}
            </Row>
            <Content>
                <table>
                    <tbody>
                    <tr>
                        <th>NAME</th>
                        <th>TEAM</th>
                        <th>STATUS</th>
                        <th>DATE</th>
                        <th>VIEW</th>
                        <th>ACTION</th>
                    </tr>
                    {retrospectives.map(retro => {
                        const isCompleted = new Date(retro.endDate).getTime() < new Date().getTime();
                        const action = isCompleted
                            ? <TableLink to={'/retrospectives/' + retro.id}>View</TableLink>
                            : <TableLink to={'/retrospectives/' + retro.id + '/feedback'}>{retro.evaluation ? 'Edit' : 'Give'} feedback</TableLink>;

                        return <tr key={retro.id}>
                            <td>{retro.name}</td>
                            <td>{retro.team?.name}</td>
                            <td>{isCompleted ? 'COMPLETED' : 'OPEN'}</td>
                            <td>{new Date(retro.startDate).toDateString()} - {new Date(retro.endDate).toDateString()}</td>
                            <td><TableLink to={'/retrospectives/' + retro.id}>View</TableLink></td>
                            <td>{action}</td>
                        </tr>
                    })}
                    </tbody>
                </table>
            </Content>
        </main>
    );
}

export default connector(Retrospectives);
