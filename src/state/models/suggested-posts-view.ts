import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {FeedItemModel} from './feed-view'
import {cleanError} from 'lib/strings/errors'
import {
  getMultipleAuthorsPostsAsPromise,
  mergeAndFilterMultipleAuthorPostsIntoOneFeed,
} from 'lib/api/build-suggested-posts'

export class SuggestedPostsView {
  // state
  isLoading = false
  hasLoaded = false
  error = ''

  // data
  posts: FeedItemModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.posts.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    this._xLoading()
    try {
      const responses = await getMultipleAuthorsPostsAsPromise(this.rootStore)
      runInAction(() => {
        const finalPosts = mergeAndFilterMultipleAuthorPostsIntoOneFeed(
          this.rootStore,
          responses,
        )
        // hydrate into models
        this.posts = finalPosts.map((post, i) => {
          return new FeedItemModel(this.rootStore, `post-${i}`, post)
        })
      })
      this._xIdle()
    } catch (e: any) {
      this.rootStore.log.error('SuggestedPostsView: Failed to load posts', {
        e,
      })
      this._xIdle() // dont bubble to the user
    }
  }

  // state transitions
  // =

  private _xLoading() {
    this.isLoading = true
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch suggested posts', err)
    }
  }
}
