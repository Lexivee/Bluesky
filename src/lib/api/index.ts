import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedPostgate,
  AtUri,
  BlobRef,
  BskyAgent,
  ComAtprotoLabelDefs,
  RichText,
} from '@atproto/api'

import {isNetworkError} from '#/lib/strings/errors'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {logger} from '#/logger'
import {ComposerImage, compressImage} from '#/state/gallery'
import {writePostgateRecord} from '#/state/queries/postgate'
import {
  createThreadgateRecord,
  ThreadgateAllowUISetting,
  threadgateAllowUISettingToAllowRecordValue,
  writeThreadgateRecord,
} from '#/state/queries/threadgate'
import {ComposerState, EmbedDraft} from '#/view/com/composer/state/composer'
import {createGIFDescription} from '../gif-alt-text'
import {LinkMeta} from '../link-meta/link-meta'
import {resolveGif, resolveLink, resolveRecord} from './resolve'
import {uploadBlob} from './upload-blob'

export {uploadBlob}

export interface ExternalEmbedDraft {
  uri: string
  isLoading: boolean
  meta?: LinkMeta
  embed?: AppBskyEmbedRecord.Main
  localThumb?: ComposerImage
}

interface PostOpts {
  composerState: ComposerState // TODO: Not used yet.
  rawText: string
  replyTo?: string
  quote?: {
    uri: string
    cid: string
  }
  extLink?: ExternalEmbedDraft
  labels?: string[]
  threadgate: ThreadgateAllowUISetting[]
  postgate: AppBskyFeedPostgate.Record
  onStateChange?: (state: string) => void
  langs?: string[]
}

export async function post(agent: BskyAgent, opts: PostOpts) {
  let reply
  let rt = new RichText({text: opts.rawText.trimEnd()}, {cleanNewlines: true})

  opts.onStateChange?.('Processing...')

  await rt.detectFacets(agent)

  rt = shortenLinks(rt)
  rt = stripInvalidMentions(rt)

  const embed = await resolveEmbed(
    agent,
    opts.composerState,
    opts.onStateChange,
  )

  // add replyTo if post is a reply to another post
  if (opts.replyTo) {
    const replyToUrip = new AtUri(opts.replyTo)
    const parentPost = await agent.getPost({
      repo: replyToUrip.host,
      rkey: replyToUrip.rkey,
    })
    if (parentPost) {
      const parentRef = {
        uri: parentPost.uri,
        cid: parentPost.cid,
      }
      reply = {
        root: parentPost.value.reply?.root || parentRef,
        parent: parentRef,
      }
    }
  }

  // set labels
  let labels: ComAtprotoLabelDefs.SelfLabels | undefined
  if (opts.labels?.length) {
    labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: opts.labels.map(val => ({val})),
    }
  }

  // add top 3 languages from user preferences if langs is provided
  let langs = opts.langs
  if (opts.langs) {
    langs = opts.langs.slice(0, 3)
  }

  let res
  try {
    opts.onStateChange?.('Posting...')
    res = await agent.post({
      text: rt.text,
      facets: rt.facets,
      reply,
      embed,
      langs,
      labels,
    })
  } catch (e: any) {
    logger.error(`Failed to create post`, {
      safeMessage: e.message,
    })
    if (isNetworkError(e)) {
      throw new Error(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
    } else {
      throw e
    }
  }

  if (opts.threadgate.some(tg => tg.type !== 'everybody')) {
    try {
      // TODO: this needs to be batch-created with the post!
      await writeThreadgateRecord({
        agent,
        postUri: res.uri,
        threadgate: createThreadgateRecord({
          post: res.uri,
          allow: threadgateAllowUISettingToAllowRecordValue(opts.threadgate),
        }),
      })
    } catch (e: any) {
      logger.error(`Failed to create threadgate`, {
        context: 'composer',
        safeMessage: e.message,
      })
      throw new Error(
        'Failed to save post interaction settings. Your post was created but users may be able to interact with it.',
      )
    }
  }

  if (
    opts.postgate.embeddingRules?.length ||
    opts.postgate.detachedEmbeddingUris?.length
  ) {
    try {
      // TODO: this needs to be batch-created with the post!
      await writePostgateRecord({
        agent,
        postUri: res.uri,
        postgate: {
          ...opts.postgate,
          post: res.uri,
        },
      })
    } catch (e: any) {
      logger.error(`Failed to create postgate`, {
        context: 'composer',
        safeMessage: e.message,
      })
      throw new Error(
        'Failed to save post interaction settings. Your post was created but users may be able to interact with it.',
      )
    }
  }

  return res
}

async function resolveEmbed(
  agent: BskyAgent,
  draft: ComposerState,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | AppBskyEmbedImages.Main
  | AppBskyEmbedVideo.Main
  | AppBskyEmbedExternal.Main
  | AppBskyEmbedRecord.Main
  | AppBskyEmbedRecordWithMedia.Main
  | undefined
> {
  if (draft.embed.quote) {
    const [resolvedMedia, resolvedQuote] = await Promise.all([
      resolveMedia(agent, draft.embed, onStateChange),
      resolveRecord(agent, draft.embed.quote.uri),
    ])
    if (resolvedMedia) {
      return {
        $type: 'app.bsky.embed.recordWithMedia',
        record: {
          $type: 'app.bsky.embed.record',
          record: resolvedQuote,
        },
        media: resolvedMedia,
      }
    }
    return {
      $type: 'app.bsky.embed.record',
      record: resolvedQuote,
    }
  }
  const resolvedMedia = await resolveMedia(agent, draft.embed, onStateChange)
  if (resolvedMedia) {
    return resolvedMedia
  }
  if (draft.embed.link) {
    const resolvedLink = await resolveLink(agent, draft.embed.link.uri)
    if (resolvedLink.type === 'record') {
      return {
        $type: 'app.bsky.embed.record',
        record: resolvedLink.record,
      }
    }
  }
  return undefined
}

async function resolveMedia(
  agent: BskyAgent,
  embedDraft: EmbedDraft,
  onStateChange: ((state: string) => void) | undefined,
): Promise<
  | AppBskyEmbedExternal.Main
  | AppBskyEmbedImages.Main
  | AppBskyEmbedVideo.Main
  | undefined
> {
  if (embedDraft.media?.type === 'images') {
    const imagesDraft = embedDraft.media.images
    logger.debug(`Uploading images`, {
      count: imagesDraft.length,
    })
    onStateChange?.(`Uploading images...`)
    const images: AppBskyEmbedImages.Image[] = await Promise.all(
      imagesDraft.map(async (image, i) => {
        logger.debug(`Compressing image #${i}`)
        const {path, width, height, mime} = await compressImage(image)
        logger.debug(`Uploading image #${i}`)
        const res = await uploadBlob(agent, path, mime)
        return {
          image: res.data.blob,
          alt: image.alt,
          aspectRatio: {width, height},
        }
      }),
    )
    return {
      $type: 'app.bsky.embed.images',
      images,
    }
  }
  if (
    embedDraft.media?.type === 'video' &&
    embedDraft.media.video.status === 'done'
  ) {
    const videoDraft = embedDraft.media.video
    const captions = await Promise.all(
      videoDraft.captions
        .filter(caption => caption.lang !== '')
        .map(async caption => {
          const {data} = await agent.uploadBlob(caption.file, {
            encoding: 'text/vtt',
          })
          return {lang: caption.lang, file: data.blob}
        }),
    )
    return {
      $type: 'app.bsky.embed.video',
      video: videoDraft.pendingPublish.blobRef,
      alt: videoDraft.altText || undefined,
      captions: captions.length === 0 ? undefined : captions,
      aspectRatio: {
        width: videoDraft.asset.width,
        height: videoDraft.asset.height,
      },
    }
  }
  if (embedDraft.media?.type === 'gif') {
    const gifDraft = embedDraft.media
    const resolvedGif = await resolveGif(agent, gifDraft.gif)
    let blob: BlobRef | undefined
    if (resolvedGif.thumb) {
      onStateChange?.('Uploading link thumbnail...')
      const {path, mime} = resolvedGif.thumb.source
      const response = await uploadBlob(agent, path, mime)
      blob = response.data.blob
    }
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: resolvedGif.uri,
        title: resolvedGif.title,
        description: createGIFDescription(resolvedGif.title, gifDraft.alt),
        thumb: blob,
      },
    }
  }
  if (embedDraft.link) {
    const resolvedLink = await resolveLink(agent, embedDraft.link.uri)
    if (resolvedLink.type === 'external') {
      let blob: BlobRef | undefined
      if (resolvedLink.thumb) {
        onStateChange?.('Uploading link thumbnail...')
        const {path, mime} = resolvedLink.thumb.source
        const response = await uploadBlob(agent, path, mime)
        blob = response.data.blob
      }
      return {
        $type: 'app.bsky.embed.external',
        external: {
          uri: resolvedLink.uri,
          title: resolvedLink.title,
          description: resolvedLink.description,
          thumb: blob,
        },
      }
    }
  }
  return undefined
}
