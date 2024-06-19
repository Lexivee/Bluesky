import React from 'react'
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, AppBskyGraphDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {createThreadgate} from '#/lib/api'
import {HITSLOP_10} from '#/lib/constants'
import {makeListLink, makeProfileLink} from '#/lib/routes/links'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {RQKEY_ROOT as POST_THREAD_RQKEY_ROOT} from '#/state/queries/post-thread'
import {
  ThreadgateSetting,
  threadgateViewToSettings,
} from '#/state/queries/threadgate'
import {useAgent} from '#/state/session'
import * as Toast from 'view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Text} from '#/components/Typography'
import {TextLink} from '../util/Link'

interface WhoCanReplyProps {
  post: AppBskyFeedDefs.PostView
  isThreadAuthor: boolean
  style?: StyleProp<ViewStyle>
}

export function WhoCanReplyInline({
  post,
  isThreadAuthor,
  style,
}: WhoCanReplyProps) {
  const {_} = useLingui()
  const t = useTheme()
  const infoDialogControl = useDialogControl()
  const {settings, isRootPost, onPressEdit} = useWhoCanReply(post)

  if (!isRootPost) {
    return null
  }
  if (!settings.length && !isThreadAuthor) {
    return null
  }

  const isEverybody = settings.length === 0
  const isNobody = !!settings.find(gate => gate.type === 'nobody')
  const description = isEverybody
    ? _(msg`Everybody can reply`)
    : isNobody
    ? _(msg`Replies disabled`)
    : _(msg`Some people can reply`)

  return (
    <>
      <Button
        label={
          isThreadAuthor ? _(msg`Edit who can reply`) : _(msg`Who can reply`)
        }
        onPress={isThreadAuthor ? onPressEdit : infoDialogControl.open}
        hitSlop={HITSLOP_10}>
        {({hovered}) => (
          <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_xs, style]}>
            <Icon
              color={t.palette.contrast_400}
              width={16}
              settings={settings}
            />
            <Text
              style={[
                a.text_sm,
                a.leading_tight,
                t.atoms.text_contrast_medium,
                hovered && a.underline,
              ]}>
              {description}
            </Text>
          </View>
        )}
      </Button>
      <InfoDialog control={infoDialogControl} post={post} settings={settings} />
    </>
  )
}

export function WhoCanReplyBlock({
  post,
  isThreadAuthor,
  style,
}: WhoCanReplyProps) {
  const {_} = useLingui()
  const t = useTheme()
  const infoDialogControl = useDialogControl()
  const {settings, isRootPost, onPressEdit} = useWhoCanReply(post)

  if (!isRootPost) {
    return null
  }
  if (!settings.length && !isThreadAuthor) {
    return null
  }

  const isEverybody = settings.length === 0
  const isNobody = !!settings.find(gate => gate.type === 'nobody')
  const description = isEverybody
    ? _(msg`Everybody can reply`)
    : isNobody
    ? _(msg`Replies on this thread are disabled`)
    : _(msg`Some people can reply`)

  return (
    <>
      <Button
        label={
          isThreadAuthor ? _(msg`Edit who can reply`) : _(msg`Who can reply`)
        }
        onPress={isThreadAuthor ? onPressEdit : infoDialogControl.open}
        hitSlop={HITSLOP_10}>
        {({hovered}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.py_sm,
              a.pr_lg,
              style,
            ]}>
            <View style={[{paddingLeft: 25, paddingRight: 18}]}>
              <Icon color={t.palette.contrast_300} settings={settings} />
            </View>
            <Text
              style={[
                a.text_sm,
                a.leading_tight,
                t.atoms.text_contrast_medium,
                hovered && a.underline,
              ]}>
              {description}
            </Text>
          </View>
        )}
      </Button>
      <InfoDialog control={infoDialogControl} post={post} settings={settings} />
    </>
  )
}

function Icon({
  color,
  width,
  settings,
}: {
  color: string
  width?: number
  settings: ThreadgateSetting[]
}) {
  const isEverybody = settings.length === 0
  const isNobody = !!settings.find(gate => gate.type === 'nobody')
  const IconComponent = isEverybody ? Earth : isNobody ? CircleBanSign : Group
  return <IconComponent fill={color} width={width} />
}

function InfoDialog({
  control,
  post,
  settings,
}: {
  control: Dialog.DialogControlProps
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateSetting[]
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Who can reply dialog`)}
        style={[{width: 'auto', maxWidth: 400, minWidth: 200}]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_xl]}>
            <Trans>Who can reply?</Trans>
          </Text>
          <Rules post={post} settings={settings} />
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Rules({
  post,
  settings,
}: {
  post: AppBskyFeedDefs.PostView
  settings: ThreadgateSetting[]
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_md,
        a.leading_tight,
        a.flex_wrap,
        t.atoms.text_contrast_medium,
      ]}>
      {!settings.length ? (
        <Trans>Everybody can reply</Trans>
      ) : settings[0].type === 'nobody' ? (
        <Trans>Replies to this thread are disabled</Trans>
      ) : (
        <Trans>
          Only{' '}
          {settings.map((rule, i) => (
            <>
              <Rule
                key={`rule-${i}`}
                rule={rule}
                post={post}
                lists={post.threadgate!.lists}
              />
              <Separator key={`sep-${i}`} i={i} length={settings.length} />
            </>
          ))}{' '}
          can reply
        </Trans>
      )}
    </Text>
  )
}

function Rule({
  rule,
  post,
  lists,
}: {
  rule: ThreadgateSetting
  post: AppBskyFeedDefs.PostView
  lists: AppBskyGraphDefs.ListViewBasic[] | undefined
}) {
  const t = useTheme()
  if (rule.type === 'mention') {
    return <Trans>mentioned users</Trans>
  }
  if (rule.type === 'following') {
    return (
      <Trans>
        users followed by{' '}
        <TextLink
          type="sm"
          href={makeProfileLink(post.author)}
          text={`@${post.author.handle}`}
          style={{color: t.palette.primary_500}}
        />
      </Trans>
    )
  }
  if (rule.type === 'list') {
    const list = lists?.find(l => l.uri === rule.list)
    if (list) {
      const listUrip = new AtUri(list.uri)
      return (
        <Trans>
          <TextLink
            type="sm"
            href={makeListLink(listUrip.hostname, listUrip.rkey)}
            text={list.name}
            style={{color: t.palette.primary_500}}
          />{' '}
          members
        </Trans>
      )
    }
  }
}

function Separator({i, length}: {i: number; length: number}) {
  if (length < 2 || i === length - 1) {
    return null
  }
  if (i === length - 2) {
    return (
      <>
        {length > 2 ? ',' : ''} <Trans>and</Trans>{' '}
      </>
    )
  }
  return <>, </>
}

function useWhoCanReply(post: AppBskyFeedDefs.PostView) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {openModal} = useModalControls()

  const settings = React.useMemo(
    () => threadgateViewToSettings(post.threadgate),
    [post],
  )
  const isRootPost = !('reply' in post.record)

  const onPressEdit = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    openModal({
      name: 'threadgate',
      settings,
      async onConfirm(newSettings: ThreadgateSetting[]) {
        try {
          if (newSettings.length) {
            await createThreadgate(agent, post.uri, newSettings)
          } else {
            await agent.api.com.atproto.repo.deleteRecord({
              repo: agent.session!.did,
              collection: 'app.bsky.feed.threadgate',
              rkey: new AtUri(post.uri).rkey,
            })
          }
          Toast.show('Thread settings updated')
          queryClient.invalidateQueries({
            queryKey: [POST_THREAD_RQKEY_ROOT],
          })
        } catch (err) {
          Toast.show(
            'There was an issue. Please check your internet connection and try again.',
          )
          logger.error('Failed to edit threadgate', {message: err})
        }
      },
    })
  }

  return {settings, isRootPost, onPressEdit}
}
