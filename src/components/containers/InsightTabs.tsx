import React, {FC} from 'react';
import styled from "styled-components";
import {connect, ConnectedProps} from "react-redux";
import {RootState} from "../../store/rootReducer";
import {Container} from "../shared/Common";
import {Link, Redirect} from "react-router-dom";
import {ITeam} from "../../models/ITeam";

const FiltersRow = styled.div`
  background-color: white;
  border-bottom: 1px solid #C6C6C6;
`

const FilterTab = styled(Link).attrs((props: { selected: boolean }) => ({
    selected: props.selected || false,
}))`
  padding: 15px 20px;
  text-decoration: none;
  color: inherit;
  display: inline-block;
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
`


const mapState = (state: RootState) => ({
    teams: state.teamReducer.teams,
    user: state.authenticationReducer.user
});


const connector = connect(mapState)

interface IProps {
    activePath: string;
}

interface IFilterTab {
    team: ITeam,
    path: string;
    name: string;
    defaultVisible: boolean
}

type PropsFromRedux = ConnectedProps<typeof connector> & IProps;

const InsightTabs: FC<PropsFromRedux> = ({activePath, teams, user}) => {
    const teamMemberFilters = teams
        .filter(t => t.members.some(m => m.userId === user?.id && m.role.canViewMemberInsights))
        .reduce((acc: IFilterTab[], team: ITeam) => {
            return [...acc, ...team.members.map(m => {
                return {
                    team: team,
                    path: `/insights/teams/${team.id}/members/${m.userId}`,
                    name: `${m.user.fullName} (${team.name})`,
                    defaultVisible: false
                };
            })];
    }, []);

    const teamFilters = [
        ...teams.map(t => ({team: t, path: `/insights/teams/${t.id}/me`, name: `${t.name} (Me)`, defaultVisible: true})),
        ...teams.map(t => ({team: t, path: `/insights/teams/${t.id}/overall`, name: `${t.name} (Overall)`, defaultVisible: true})),
        ...teams
            .filter(t => t.members.some(m => m.userId === user?.id && m.role.canViewMemberInsights))
            .map(t => ({team: t, path: `/insights/teams/${t.id}/members`, name: `${t.name} (Members)`, defaultVisible: true})),
        ...teamMemberFilters
    ];

    const noTabMatched = teamFilters.length > 0 && teamFilters.every(filter => filter.path !== activePath);

    if (noTabMatched) {
        return <Redirect to={teamFilters[0].path}/>
    }

    return (
        <FiltersRow>
            <Container>
                {teamFilters.filter(f => f.defaultVisible || f.path === activePath).map(filter => {
                    return <FilterTab key={filter.path} selected={filter.path === activePath}
                               to={filter.path}>{filter.name}</FilterTab>
                })}
            </Container>
        </FiltersRow>
    );
}

export default connector(InsightTabs);
