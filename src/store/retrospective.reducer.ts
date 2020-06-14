import {RetrospectiveActionTypes, RetrospectiveTypes} from "./retrospective.actions";
import {IRetrospective} from "../models/IRetrospective";

export interface IRetrospectivesState {
    retrospectives: IRetrospective[]
}

const initialState: IRetrospectivesState = {
    retrospectives: []
}

export function retrospectiveReducer(state: IRetrospectivesState = initialState, action: RetrospectiveTypes) {
    switch (action.type) {
        case RetrospectiveActionTypes.LOADED:
            return {
                ...state,
                retrospectives: action.retrospectives
            }
        case RetrospectiveActionTypes.ADDED:
            return {
                ...state,
                retrospectives: [action.retrospective, ...state.retrospectives]
            }
        default:
            return state
    }
}
