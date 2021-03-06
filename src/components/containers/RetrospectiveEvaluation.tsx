import React, {ChangeEvent, Component} from 'react';
import styled from "styled-components";
import {RootState} from "../../store/rootReducer";
import {connect, ConnectedProps} from "react-redux";
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {CategorySlider, ICategory} from "../presentation/common/CategorySlider";
import {ValueSlider} from "../presentation/common/ValueSlider";
import {IEvaluation} from "../../models/IEvaluation";
import * as retrospectiveActions from "../../store/retrospective.actions";
import {TextArea, InputLabel, InputDescription} from "../styles/Input";
import {ICommentCategory} from "../../models/ICommentCategory";
import {IComment} from "../../models/IComment";
import {ITimeUsage} from "../../models/ITimeUsage";
import {IUserRetrospective} from "../../models/IUserRetrospective";
import {ITimeUsageCategory} from "../../models/ITimeUsageCategory";
import {Icon} from "../styles/Icons";
import {Container, Content, Spacer} from "../styles/Common";
import {parseId} from "../../helpers/Uri";
import {EntityIdentifier} from "../../types";
import {LoadingBar} from "../presentation/common/LoadingBar";
import {QueueHelper} from "../../helpers/QueueHelper";
import SecureIcon from "../presentation/common/icons/SecureIcon";
import {NotFound} from "../presentation/NotFound";

const InputGrid = styled.div`
  display: flex;
  justify-content: space-between;
`

const GridColumn = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
`

const Input = styled.input`
  border-radius: 5px;
  padding: 7px 10px;
  margin-left: 10px;
  border: 1px solid #707070;
  flex-grow: 1;
  margin-right: 25px;
`

const InputRow = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
`

const mapState = (state: RootState) => ({
    retrospectives: state.retrospectiveReducer.retrospectives,
    isLoadingRetrospectives: state.retrospectiveReducer.isLoadingRetrospectives,
    commentCategories: state.commentCategoryReducer.commentCategories,
    timeUsageCategories: state.timeUsageCategoryReducer.timeUsageCategories,
});

const mapDispatch = {
    createOrUpdate: (evaluation: IEvaluation) => retrospectiveActions.CreateOrUpdateEvaluation(evaluation),
}

const connector = connect(mapState, mapDispatch)

interface IProps {
    readonly: boolean
}

type Props = ConnectedProps<typeof connector> & RouteComponentProps<{ id: string }> & IProps;

interface IState {
    evaluation: IEvaluation,
    retrospective: IUserRetrospective,
    commentsById: { [id: string]: IComment },
    isLoading: boolean,
}

class RetrospectiveEvaluation extends Component<Props, IState> {
    state: IState = {
        evaluation: {
            retrospectiveId: 0,
            timeUsage: [],
            sprintRating: 50,
            sprintRatingExplanation: '',
            suggestedActions: '',
            suggestedTopics: '',
            comments: [],
        },
        retrospective: {
            name: ''
        } as IUserRetrospective,
        commentsById: {},
        isLoading: false,
    }

    componentDidMount() {
        this.loadEvaluation();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<IState>, snapshot?: any) {
        if (this.props !== prevProps) {
            this.loadEvaluation();
        }
    }

    private queueSave = (bounceInMs: number = 500) => {
        QueueHelper.queue(bounceInMs, 500,
            () => {
                this.createOrUpdate();
                this.setState({isLoading: true});
            },
            () => this.setState({isLoading: false})
        );
    }

    private loadEvaluation() {
        const {retrospective: initialRetrospective, evaluation: initialEvaluation} = this.state
        const {match, retrospectives, commentCategories, timeUsageCategories} = this.props
        const retrospectiveId = parseId(match.params.id);

        const retrospective: IUserRetrospective = retrospectives.find(r => r.id === retrospectiveId) || initialRetrospective;
        const hasProvidedEvaluation = retrospective && !!retrospective.evaluation;

        let evaluation = hasProvidedEvaluation ? retrospective!.evaluation! : initialEvaluation;
        evaluation.retrospectiveId = retrospectiveId;

        const evaluationState = this.buildEvaluation(evaluation, commentCategories, timeUsageCategories);

        this.setState({
            ...evaluationState,
            retrospective
        })
    }

    private buildEvaluation(evaluation: IEvaluation, commentCategories: ICommentCategory[], timeUsageCategories: ITimeUsageCategory[]) {
        const commentCountPerCategory = 3;

        const commentsById = commentCategories.reduce((acc: { [key: number]: IComment }, category, categoryIndex) => {
            const existingComments = Object.values(evaluation.comments).filter(e => (e.categoryId || e.category.id) === category.id);
            const amountOfMissingComments = Math.max(0, commentCountPerCategory - existingComments.length);

            const nextComments = [
                ...existingComments,
                ...Array(amountOfMissingComments).fill({categoryId: category.id, body: ''})
            ].map((c, i) => ({
                ...c,
                categoryId: c.categoryId || c.category.id,
                id: c.id || (parseInt(categoryIndex + '' + i) * -1)
            }));

            nextComments.forEach(c => acc[c.id] = c);

            return acc;
        }, {});

        const timeUsage = this.getSliderCategoriesAsTimeUsage(evaluation, this.getAsSliderCategories(evaluation, timeUsageCategories));

        return {
            commentsById,
            evaluation: {
                ...evaluation,
                comments: Object.values(commentsById),
                timeUsage
            }
        };
    }

    private getSliderCategoriesAsTimeUsage(evaluation: IEvaluation, categories: ICategory[]): ITimeUsage[] {
        return categories.map(category => {
            const existingUsage = evaluation.timeUsage.find(t => t.categoryId === category.id);

            if (existingUsage) {
                return {...existingUsage, percentage: category.value}
            }

            return {categoryId: category.id, percentage: category.value} as ITimeUsage;
        });
    }

    private handleTimeUsageChange = (categories: ICategory[]) => {
        const {evaluation} = this.state;
        const timeUsage = this.getSliderCategoriesAsTimeUsage(evaluation, categories);

        this.setState({
            evaluation: {...evaluation, timeUsage}
        })

        this.queueSave();
    }

    private handleCommentsChange = (commentId: EntityIdentifier, event: ChangeEvent<HTMLInputElement>) => {
        const {commentsById} = this.state

        const commentToUpdate = commentsById[commentId];
        const nextComments: { [key: number]: IComment } = {
            ...commentsById,
            [commentId]: {...commentToUpdate, body: event.target.value}
        };

        this.setState({
            commentsById: nextComments
        });

        this.queueSave(2000);
    }

    private handleSprintRatingChange = (sprintRating: number) => {
        this.setState(state => ({
            evaluation: {...state.evaluation, sprintRating}
        }));

        this.queueSave();
    }

    private handleEvaluationChange = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
        const {name, value} = event.target;

        this.setState(state => ({
            evaluation: {...state.evaluation, [name]: value}
        }));

        this.queueSave(1500);
    }

    private createOrUpdate = () => {
        const {evaluation, commentsById} = this.state
        const {createOrUpdate} = this.props;

        const transformedComments = Object.values(commentsById).filter(c => c.body).map(c => {
            const updatedComment = {...c};
            if (updatedComment.id <= 0) {
                delete updatedComment.id;
            }
            return updatedComment;
        });

        createOrUpdate({...evaluation, comments: transformedComments})
    }

    private getAsSliderCategories(evaluation: IEvaluation, categories: ITimeUsageCategory[]) {
        return categories.map((c: ITimeUsageCategory) => {
            const existingTimeUsage = evaluation.timeUsage.find(t => (t.categoryId || t.category.id) === c.id);
            return {...c, value: existingTimeUsage ? existingTimeUsage.percentage : c.initialPercentage};
        })
    }

    render() {
        const {retrospective, evaluation, commentsById, isLoading} = this.state
        const {isLoadingRetrospectives, timeUsageCategories, commentCategories, readonly} = this.props

        const sliderCategories = this.getAsSliderCategories(evaluation, timeUsageCategories);

        const commentsByCategory = Object.values(commentsById).reduce((acc: { [key: string]: IComment[] }, cur) => {
            acc[cur.categoryId] = [...acc[cur.categoryId] || [], cur];
            return acc;
        }, {})

        if (!isLoadingRetrospectives && !retrospective.id) {
            return <NotFound
                message='The retrospective could not be found, are you invited to the team that has invited you for feedback?'/>
        }

        if (isLoadingRetrospectives) {
            return null;
        }

        return (
            <Container>
                <h1>Retrospective: {retrospective.name}</h1>
                <Content>
                    <LoadingBar isLoading={isLoading} loadingDuration={600}/>

                    <form onSubmit={e => e.preventDefault()}>
                        <p style={{marginTop: 0}}>TIME USAGE</p>
                        <InputLabel>Balance <SecureIcon color='#808080'
                                                        title='Only used to calculate average in the team overview, visible as raw numbers for scrum-masters and managers.'/></InputLabel>
                        <InputDescription>Adjust the slider to indicate how your sprint was spent such as how much time
                            was available
                            to
                            focus.</InputDescription>
                        <CategorySlider categories={sliderCategories}
                                        onCategoriesChange={this.handleTimeUsageChange}
                                        disabled={readonly}
                        />

                        <InputLabel style={{marginBottom: 0}}><b>Sprint rating</b> <SecureIcon color='#808080'
                                                                                               title='Only used to calculate average in the team overview, visible as raw numbers for scrum-masters and managers.'/>
                            <span style={{fontWeight: 'normal'}}>
                                (<span style={{fontStyle: 'italic'}}>{evaluation.sprintRating / 10}/10</span>)
                            </span>
                        </InputLabel>
                        <InputDescription>What grade would you give this sprint? Base it on the status of your set goals
                            and the
                            achieved
                            results.</InputDescription>
                        <ValueSlider color='#4AE6AA' value={evaluation.sprintRating}
                                     name='sprintRating'
                                     onChange={this.handleSprintRatingChange}
                                     disabled={readonly}
                        />

                        <InputLabel>Rating explanation <SecureIcon color='#808080'
                                                                   title='Not visible for your team, only to scrum-masters and managers.'/></InputLabel>
                        <InputDescription>Please describe why you have given this grade (English or
                            Dutch).</InputDescription>
                        <TextArea placeholder='Working on example task was great, but I had quite a few meetings.'
                                  value={evaluation.sprintRatingExplanation}
                                  name='sprintRatingExplanation'
                                  onChange={this.handleEvaluationChange}
                                  disabled={readonly}
                        />

                        <Spacer/>
                        <p>FEEDBACK</p>
                        <p>Provide at least one positive point and one area where there is room for improvement. Keep
                            the
                            description brief because it will be discussed in full detail during the retrospective.</p>

                        <InputGrid>
                            {commentCategories.map((category: ICommentCategory) => <GridColumn key={category.id}>
                                {(commentsByCategory[category.id] || []).map((comment: IComment, index) => (
                                    <InputRow key={comment.id}>
                                        <Icon style={{backgroundColor: category.iconColor}}>{category.iconLabel}</Icon>
                                        <Input type='text' required={index < category.minimalCommentCount}
                                               value={comment.body} placeholder={category.description}
                                               onChange={e => this.handleCommentsChange(comment.id, e)}
                                               onBlur={() => this.queueSave(0)}
                                               disabled={readonly}
                                        />
                                    </InputRow>
                                ))}
                            </GridColumn>)}
                        </InputGrid>

                        <Spacer/>
                        <p>SUGGESTIONS</p>
                        <p>What actions should be taken for the next sprint?</p>
                        <TextArea placeholder='E.g changing the workflow or appointing a single person to hide it.'
                                  value={evaluation.suggestedActions}
                                  name='suggestedActions'
                                  onChange={this.handleEvaluationChange}
                                  disabled={readonly}
                        />
                        <Spacer/>
                        <p>FEEDBACK</p>
                        <p>What should be discussed during the retrospective?</p>
                        <TextArea placeholder='E.g how we handle onboarding'
                                  value={evaluation.suggestedTopics}
                                  name='suggestedTopics'
                                  onChange={this.handleEvaluationChange}
                                  disabled={readonly}
                        />
                    </form>
                </Content>
            </Container>
        );
    }
}

export default withRouter(connector(RetrospectiveEvaluation));
