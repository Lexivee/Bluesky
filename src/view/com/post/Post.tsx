import React, {useMemo, useState} from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useComposerControls} from '#/state/shell/composer'
import {MAX_POST_LINES} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {countLines} from 'lib/strings/helpers'
import {colors, s} from 'lib/styles'
import {precacheProfile} from 'state/queries/profile'
import {AviFollowButton} from '#/view/com/posts/AviFollowButton'
import {atoms as a} from '#/alf'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {ContentHider} from '../../../components/moderation/ContentHider'
import {LabelsOnMyPost} from '../../../components/moderation/LabelsOnMe'
import {PostAlerts} from '../../../components/moderation/PostAlerts'
import {Link, TextLink} from '../util/Link'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {PostMeta} from '../util/PostMeta'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {UserInfoText} from '../util/UserInfoText'

export function Post({
  post,
  showReplyLine,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  showReplyLine?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const moderationOpts = useModerationOpts()
  const record = useMemo<AppBskyFeedPost.Record | undefined>(
    () =>
      AppBskyFeedPost.isRecord(post.record) &&
      AppBskyFeedPost.validateRecord(post.record).success
        ? post.record
        : undefined,
    [post],
  )
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      record
        ? new RichTextAPI({
            text: record.text,
            facets: record.facets,
          })
        : undefined,
    [record],
  )
  const moderation = useMemo(
    () => (moderationOpts ? moderatePost(post, moderationOpts) : undefined),
    [moderationOpts, post],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return null
  }
  if (record && richText && moderation) {
    return (
      <PostInner
        post={postShadowed}
        record={record}
        richText={richText}
        moderation={moderation}
        showReplyLine={showReplyLine}
        style={style}
      />
    )
  }
  return null
}

function PostInner({
  post,
  record,
  richText,
  moderation,
  showReplyLine,
  style,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  moderation: ModerationDecision
  showReplyLine?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openComposer} = useComposerControls()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const itemUrip = new AtUri(post.uri)
  const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey)
  let replyAuthorDid = ''
  if (record.reply) {
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    replyAuthorDid = urip.hostname
  }

  const onPressReply = React.useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
      },
    })
  }, [openComposer, post, record, moderation])

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  const onBeforePress = React.useCallback(() => {
    precacheProfile(queryClient, post.author)
  }, [queryClient, post.author])

  return (
    <Link
      href={itemHref}
      style={[styles.outer, pal.border, style]}
      onBeforePress={onBeforePress}>
      {showReplyLine && <View style={styles.replyLine} />}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <AviFollowButton author={post.author} moderation={moderation}>
            <PreviewableUserAvatar
              size={52}
              profile={post.author}
              moderation={moderation.ui('avatar')}
              type={post.author.associated?.labeler ? 'labeler' : 'user'}
            />
          </AviFollowButton>
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={post.author}
            moderation={moderation}
            authorHasWarning={!!post.author.labels?.length}
            timestamp={post.indexedAt}
            postHref={itemHref}
          />
          {replyAuthorDid !== '' && (
            <View style={[s.flexRow, s.mb2, s.alignCenter]}>
              <FontAwesomeIcon
                icon="reply"
                size={9}
                style={[pal.textLight, s.mr5]}
              />
              <Text
                type="sm"
                style={[pal.textLight, s.mr2]}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans context="description">
                  Reply to{' '}
                  <ProfileHoverCard inline did={replyAuthorDid}>
                    <UserInfoText
                      type="sm"
                      did={replyAuthorDid}
                      attr="displayName"
                      style={[pal.textLight]}
                    />
                  </ProfileHoverCard>
                </Trans>
              </Text>
            </View>
          )}
          <LabelsOnMyPost post={post} />
          <ContentHider
            modui={moderation.ui('contentView')}
            style={styles.contentHider}
            childContainerStyle={styles.contentHiderChild}>
            <PostAlerts
              modui={moderation.ui('contentView')}
              style={[a.py_xs]}
            />
            {richText.text ? (
              <View style={styles.postTextContainer}>
                <RichText
                  enableTags
                  testID="postText"
                  value={richText}
                  numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                  style={[a.flex_1, a.text_md]}
                  authorHandle={post.author.handle}
                />
              </View>
            ) : undefined}
            {limitLines ? (
              <TextLink
                text={_(msg`Show More`)}
                style={pal.link}
                onPress={onPressShowMore}
                href="#"
              />
            ) : undefined}
            {post.embed ? (
              <PostEmbeds embed={post.embed} moderation={moderation} />
            ) : null}
          </ContentHider>
          <PostCtrls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            logContext="Post"
          />
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingTop: 10,
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 10,
    borderTopWidth: 1,
    // @ts-ignore web only -prf
    cursor: 'pointer',
  },
  layout: {
    flexDirection: 'row',
    gap: 10,
  },
  layoutAvi: {
    // width: 70,
    paddingLeft: 8,
  },
  layoutContent: {
    flex: 1,
  },
  alert: {
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  replyLine: {
    position: 'absolute',
    left: 36,
    top: 70,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  contentHider: {
    marginBottom: 2,
  },
  contentHiderChild: {
    marginTop: 6,
  },
})
