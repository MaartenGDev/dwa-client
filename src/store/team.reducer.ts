import {TeamActionTypes, TeamTypes} from "./team.actions";
import {ITeam} from "../models/ITeam";

export interface ITeamState {
    teams: ITeam[],
    isLoadingTeams: boolean,
    teamForInviteCode?: ITeam,
}

const initialState: ITeamState = {
    teams: [] as ITeam[],
    isLoadingTeams: true,
    teamForInviteCode: undefined
}

export function teamReducer(state: ITeamState = initialState, action: TeamTypes) {
    switch (action.type) {
        case TeamActionTypes.LOADING:
            return {
                ...state,
                isLoadingTeams: true
            }
        case TeamActionTypes.LOADED:
            return {
                ...state,
                teams: action.teams,
                isLoadingTeams: false
            }
        case TeamActionTypes.ADDED:
            return {
                ...state,
                teams: [...state.teams, action.team]
            }
        case TeamActionTypes.UPDATED:
            return {
                ...state,
                teams: [...state.teams.filter(t => t.id !== action.team.id), action.team]
            }
        case TeamActionTypes.DELETED:
            return {
                ...state,
                teams: [...state.teams.filter(t => t.id !== action.teamId)]
            }
        case TeamActionTypes.LOADED_FOR_INVITE_CODE:
            return {
                ...state,
                teamForInviteCode: action.team
            }
        default:
            return state
    }
}
