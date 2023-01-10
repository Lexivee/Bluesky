import React from 'react'
import {render} from '../../../../jest/test-utils'
import {NotificationsViewItemModel} from '../../../../src/state/models/notifications-view'
import {FeedItem} from '../../../../src/view/com/notifications/FeedItem'
import {
  mockedNotificationsViewItemModel,
  mockedPostThreadViewModel,
} from '../../../../__mocks__/state-mock'

describe('FeedItem', () => {
  const mockedProps = {
    item: mockedNotificationsViewItemModel as NotificationsViewItemModel,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders upvote', () => {
    const {findAllByTestId} = render(<FeedItem {...mockedProps} />)

    const noFeedbackLinkButton = findAllByTestId(
      'linkButton-/profile/testuri/post/',
    )
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders repost', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isRepost: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId(
      'linkButton-/profile/testuri/post/',
    )
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders trend', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isTrend: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId(
      'linkButton-/profile/testuri/post/',
    )
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders follow', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isFollow: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId(
      'linkButton-/profile/test.handle',
    )
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders reply', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isReply: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId(
      'linkButton-/profile/testuri/post/',
    )
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders mention', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isMention: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId('linkButton-')
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders invite', () => {
    const {findAllByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            isUpvote: false,
            isInvite: true,
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const noFeedbackLinkButton = findAllByTestId('linkButton-')
    expect(noFeedbackLinkButton).toBeTruthy()
  })

  it('renders error additional post', async () => {
    const {findByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            additionalPost: {
              ...mockedPostThreadViewModel,
              error: 'testerrorr',
              thread: {
                ...mockedPostThreadViewModel.thread,
                postRecord: {
                  text: 'test text',
                  createdAt: '',
                },
              },
            },
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const errorMessageView = findByTestId('errorMessageView')
    expect(errorMessageView).toBeTruthy()
  })

  it('renders additional post', async () => {
    const {findByTestId} = render(
      <FeedItem
        {...{
          item: {
            ...mockedNotificationsViewItemModel,
            additionalPost: {
              ...mockedPostThreadViewModel,
              thread: {
                ...mockedPostThreadViewModel.thread,
                postRecord: {
                  text: 'test text',
                  createdAt: '',
                },
              },
            },
          } as NotificationsViewItemModel,
        }}
      />,
    )

    const additionalPostContent = findByTestId('additionalPostContent')
    expect(additionalPostContent).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<FeedItem {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
