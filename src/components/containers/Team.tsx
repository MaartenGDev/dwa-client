import React, {FC, useState} from 'react';
import styled from "styled-components";
import {RootState} from "../../store/rootReducer";
import {connect, ConnectedProps} from "react-redux";
import {Redirect, RouteComponentProps, withRouter} from 'react-router-dom';
import {TextInput} from "../styles/Input";
import * as teamActions from "../../store/team.actions";
import {ITeam} from "../../models/ITeam";
import Config from "../../Config";
import {Container, Row, SectionTitle, Title} from "../styles/Common";
import {RoundedButton, RoundedButtonLink} from "../styles/Buttons";
import {parseId} from "../../helpers/Uri";
import {EntityIdentifier} from "../../types";
import {NotFound} from "../presentation/NotFound";

const Content = styled.div`
  padding: 20px;
  background-color: #ffffff;
`

const mapState = (state: RootState) => ({
    retrospectives: state.retrospectiveReducer.retrospectives,
    teams: state.teamReducer.teams,
    isLoadingTeams: state.teamReducer.isLoadingTeams,
    user: state.authenticationReducer.user,
});

const mapDispatch = {
    createOrUpdate: (team: ITeam) => teamActions.CreateOrUpdate(team),
    deleteTeam: (teamId: EntityIdentifier) => teamActions.Delete(teamId)
}
const connector = connect(mapState, mapDispatch)
type IProps = ConnectedProps<typeof connector> & RouteComponentProps<{ id?: string }>;


const Team: FC<IProps> = ({isLoadingTeams, teams, user, deleteTeam, match}) => {
    const team = teams.find(t => t.id === parseId(match.params.id!));
    const [redirectToOverview, setShouldRedirect] = useState(false);

    if (isLoadingTeams) {
        return <Container><Content><p>Loading..</p></Content></Container>
    }

    if (!team) {
        return <NotFound message='Team not found, are you invited to the team?'/>
    }

    const promptDelete = (teamId: EntityIdentifier) => {
        if (!window.confirm('Are you sure?')) return;
        deleteTeam(teamId);
        setShouldRedirect(true);
    }

    const isAdminOfTeam = team!.members.some(m => m.user.id === user?.id && m.role.canManageTeam);
    const showInviteCode = isAdminOfTeam && team.inviteCode;

    if (redirectToOverview) {
        return <Redirect to={'/teams'}/>
    }

    return (
        <Container>
            <Row>
                <Title>Team: {team.name}</Title>

                {isAdminOfTeam && <div>
                    <RoundedButton data-testid='delete-action' style={{marginRight: '10px'}} onClick={e => promptDelete(team.id!)}
                                   color='#e53935'>Remove</RoundedButton>
                    <RoundedButtonLink data-testid='edit-action' to={`/teams/${team.id}/edit`}>Edit</RoundedButtonLink>
                </div>}
            </Row>

            <Content>
                <SectionTitle>Members</SectionTitle>
                <table>
                    <tbody>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                    </tr>
                    {team.members.map(m => {
                        return <tr key={m.user.id}>
                            <td data-testid={`member-${m.user.id}-name`}>{m.user.fullName}</td>
                            <td data-testid={`member-${m.user.id}-role`}>{m.role.name}</td>
                        </tr>
                    })}
                    </tbody>
                </table>

                {showInviteCode && <>
                    <SectionTitle>Invite Link</SectionTitle>
                    <TextInput data-testid='invite-code' disabled={true} value={Config.LOCAL_TEAM_INVITE_URL(team.inviteCode)}/>
                </>}
            </Content>
        </Container>
    );
}

export default withRouter(connector(Team));
