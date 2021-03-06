import React, {FC, useEffect} from 'react';
import styled from 'styled-components'
import loginSvg from '../../assets/login.svg'
import {RouteComponentProps, withRouter} from "react-router-dom";
import {RootState} from "../../store/rootReducer";
import * as teamActions from "../../store/team.actions";
import {connect, ConnectedProps} from "react-redux";
import Config from "../../Config";
import SplitPage from "../presentation/SplitPage";

const LoginCard = styled.div`
    margin: 20%;
    background-color: white;
    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
    padding: 30px
`
const LoginHeader = styled.h3`
  margin:0;
`

const LoginSubHeader = styled.p`
  margin-top: 3px;
  color: #a1a1a1;
`

const LoginOptions = styled.div`
  margin-top: 20px;
`

const LoginBox = styled.a`
  margin-top: 10px;
  border: 1px solid #dad7d7;
  border-radius: 3px;
  display: flex;
  align-items: center;
  padding: 10px;
  text-decoration: none;
  color: black;
`

const LoginLogo = styled.img`
  height: 30px;
  width: 30px;
`

const LoginLabel = styled.span`
  margin-left: 10px;
`

const mapState = (state: RootState) => ({
    team: state.teamReducer.teamForInviteCode,
});

const mapDispatch = {
    loadTeam: (inviteCode: string) => teamActions.FindByInviteCode(inviteCode)
}

const connector = connect(mapState, mapDispatch)
type IProps = ConnectedProps<typeof connector> & RouteComponentProps<{ code: string }>;

const TeamInvite: FC<IProps> = ({team, loadTeam, match}) => {

    useEffect(() => {
        loadTeam(match.params.code);
    }, [match.params.code, loadTeam]);

    const loginUrl = Config.TEAM_INVITE_URL(team?.inviteCode!);

    return (
        <SplitPage>
            <LoginCard>
                <LoginHeader>You have been invited to {team?.name}</LoginHeader>
                <LoginSubHeader>Login with your favorite account to get started.</LoginSubHeader>

                <LoginOptions>
                    <LoginBox href={loginUrl}>
                        <LoginLogo src={loginSvg}/><LoginLabel>Login with Microsoft</LoginLabel>
                    </LoginBox>
                </LoginOptions>
            </LoginCard>
        </SplitPage>
    );
}

export default withRouter(connector(TeamInvite));
