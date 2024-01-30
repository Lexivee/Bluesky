import {Router} from 'lib/routes/router'

export const router = new Router({
  Home: '/',
  Search: '/search',
  Feeds: '/feeds',
  Notifications: '/notifications',
  Settings: '/settings',
  LanguageSettings: '/settings/language',
  Lists: '/lists',
  Moderation: '/moderation',
  ModerationModlists: '/moderation/modlists',
  ModerationMutedAccounts: '/moderation/muted-accounts',
  ModerationBlockedAccounts: '/moderation/blocked-accounts',
  ModerationMutedWords: '/moderation/muted-words',
  Profile: '/profile/:name',
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  ProfileList: '/profile/:name/lists/:rkey',
  PostThread: '/profile/:name/post/:rkey',
  PostLikedBy: '/profile/:name/post/:rkey/liked-by',
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
  ProfileFeed: '/profile/:name/feed/:rkey',
  ProfileFeedLikedBy: '/profile/:name/feed/:rkey/liked-by',
  Debug: '/sys/debug',
  Log: '/sys/log',
  AppPasswords: '/settings/app-passwords',
  PreferencesHomeFeed: '/settings/home-feed',
  PreferencesThreads: '/settings/threads',
  PreferencesExternalEmbeds: '/settings/external-embeds',
  SavedFeeds: '/settings/saved-feeds',
  Support: '/support',
  PrivacyPolicy: '/support/privacy',
  TermsOfService: '/support/tos',
  CommunityGuidelines: '/support/community-guidelines',
  CopyrightPolicy: '/support/copyright',
})
