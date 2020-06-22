import React, {FC, useEffect} from 'react';
import styled from "styled-components";
import {RootState} from "../../store/rootReducer";
import {connect, ConnectedProps} from "react-redux";
import {RouteComponentProps, withRouter} from 'react-router-dom';
import * as retrospectiveActions from "../../store/retrospective.actions";
import {IComment} from "../../models/IComment";
import {ICommentCategory} from "../../models/ICommentCategory";
import {Icon} from "../Styling/Icons";
import {Text, TextHeader} from "../Styling/Text";
import {IUser} from "../../models/IUser";
import {Row, Title} from "../Styling/Common";
import {RoundedButtonLink} from "../Styling/Buttons";
import {TextInput} from "../Styling/Input";

const Content = styled.div`
  padding: 20px;
  background-color: #ffffff;
`

const CommentSection = styled.div`
  border: 1px solid #dad7d7;
  border-radius: 3px;
  
  div:last-of-type {
      border: none;
  }
`

const CommentGroup = styled.div`
  padding: 10px;
  border-bottom: 1px solid #dad7d7;
`

const CommentRow = styled.div`
display: flex;
margin-top: 5px;
align-items: center;
`

const SectionTitle = styled.p`
  font-weight: bold;
`

const Spacer = styled.hr`
  margin: 30px 0;
  border: 1px solid #dad7d7;
`

const mapState = (state: RootState) => ({
    commentCategories: state.commentCategoryReducer.commentCategories,
    retrospectiveReport: state.retrospectiveReducer.retrospectiveReport,
    teams: state.teamReducer.teams,
});

const mapDispatch = {
    loadReport: (retrospectiveId: number) => retrospectiveActions.LoadReport(retrospectiveId)
}

type ICommentsByCategoryAndUser = { [categoryId: number]: { id: number, users: { [userId: string]: { user: IUser, comments: IComment[] } } } };

const connector = connect(mapState, mapDispatch)
type PropsFromRedux = ConnectedProps<typeof connector> & RouteComponentProps<{ id: string }>


const Retrospective: FC<PropsFromRedux> = ({commentCategories, teams, match, retrospectiveReport, loadReport}) => {
    const retrospectiveId = parseInt(match.params.id);


    useEffect(() => {
        loadReport(retrospectiveId)
    }, [retrospectiveId, loadReport])

    if (!retrospectiveReport || commentCategories.length === 0) {
        return <main>Loading</main>
    }

    const commentCategoriesById = commentCategories.reduce((acc: { [id: string]: ICommentCategory }, cur) => {
        acc[cur.id] = cur;
        return acc;
    }, {})

    const retrospective = retrospectiveReport.retrospective;

    const commentsByCategoryAndUser = retrospectiveReport.comments.reduce((acc: ICommentsByCategoryAndUser, comment: IComment) => {
        if (!acc.hasOwnProperty(comment.categoryId)) {
            acc[comment.categoryId] = {
                id: comment.categoryId,
                users: {}
            }
        }

        const owner = comment.evaluation!.user!;

        if (!acc[comment.categoryId].users.hasOwnProperty(owner.id)) {
            acc[comment.categoryId].users[owner.id] = {
                user: owner,
                comments: []
            }
        }
        acc[comment.categoryId].users[owner.id].comments = [...acc[comment.categoryId].users[owner.id].comments, comment];

        return acc;
    }, {});

    const canEditRetrospective = teams.some(team => team.id === retrospective.teamId);

    return (
        <main>
            <Row>
                <Title>Retrospective: {retrospective.name}</Title>
                {canEditRetrospective &&
                <RoundedButtonLink to={`/retrospectives/${retrospective.id}/edit`}>Edit</RoundedButtonLink>}
            </Row>
            <Content>
                <SectionTitle>AGENDA</SectionTitle>
                <table>
                    <tbody>
                    <tr>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Type</th>
                    </tr>
                    {retrospective.topics.map(topic => {
                        return <tr key={topic.id}>
                            <td>{topic.description}</td>
                            <td>{topic.durationInMinutes} minutes</td>
                            <td>Provided</td>
                        </tr>
                    })}
                    {retrospectiveReport.suggestedTopics.map((topic, index) => {
                        return <tr key={-index}>
                            <td>{topic.description}</td>
                            <td>{topic.durationInMinutes} minutes</td>
                            <td>Suggested</td>
                        </tr>
                    })}
                    </tbody>
                </table>

                <Spacer/>

                {retrospective.actions.length > 0&& <>
                    <p>ACTIONS PREVIOUS SPRINT</p>
                    <table>
                        <tbody>
                        <tr>
                            <th>Done</th>
                            <th>Description</th>
                            <th>Responsible</th>
                            <th>Type</th>
                        </tr>
                        {retrospective.actions.map(event => {
                            return <tr key={event.id}>
                                <td><input readOnly type='checkbox' checked={event.isCompleted}/></td>
                                <td>{event.description}</td>
                                <td>{event.responsible}</td>
                                <td>Provided</td>
                            </tr>
                        })}
                        </tbody>
                    </table>

                    <Spacer/>
                </>}

                <SectionTitle>TO DISCUSS</SectionTitle>
                {Object.values(commentsByCategoryAndUser).map(categoryGroup => {
                        const category = commentCategoriesById[categoryGroup.id];

                        return <div key={categoryGroup.id}>
                            <TextHeader>{category.description}</TextHeader>
                            <CommentSection>
                                {Object.values(categoryGroup.users).map(userGroup => <CommentGroup key={userGroup.user.id}>
                                    <Text>{userGroup.user.name}</Text>
                                    <div>
                                        {userGroup.comments.map(c => <CommentRow key={c.id}><Icon
                                            style={{
                                                backgroundColor: category.iconColor,
                                                marginRight: '5px'
                                            }}>{category.iconLabel}</Icon> {c.body}
                                        </CommentRow>)}
                                    </div>
                                </CommentGroup>)}
                            </CommentSection>
                        </div>
                    }
                )}


                <Spacer/>

                <SectionTitle>ACTIONS NEXT SPRINT</SectionTitle>
                <table>
                    <tbody>
                    <tr>
                        <th>Description</th>
                        <th>Responsible</th>
                        <th>Type</th>
                    </tr>
                    {retrospectiveReport.suggestedActions.map((action, index) => {
                        return <tr key={-index}>
                            <td>{action.description}</td>
                            <td></td>
                            <td>Suggested</td>
                        </tr>
                    })}
                    </tbody>
                </table>

            </Content>
        </main>
    );
}

export default withRouter(connector(Retrospective));
