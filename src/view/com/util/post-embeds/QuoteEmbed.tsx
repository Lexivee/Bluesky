import React from 'react'
import {StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {AppBskyEmbedImages, AppBskyEmbedRecordWithMedia} from '@atproto/api'
import {AtUri} from '../../../../third-party/uri'
import {PostMeta} from '../PostMeta'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/models/ui/shell'
import {PostEmbeds} from '.'

export function QuoteEmbed({
  quote,
  style,
}: {
  quote: ComposerOptsQuote
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = `/profile/${quote.author.handle}/post/${itemUrip.rkey}`
  const itemTitle = `Post by ${quote.author.handle}`
  const isEmpty = React.useMemo(
    () => quote.text.trim().length === 0,
    [quote.text],
  )
  const imagesEmbed = React.useMemo(
    () =>
      quote.embeds?.find(
        embed =>
          AppBskyEmbedImages.isView(embed) ||
          AppBskyEmbedRecordWithMedia.isView(embed),
      ),
    [quote.embeds],
  )
  return (
    <Link
      style={[styles.container, pal.border, style]}
      href={itemHref}
      title={itemTitle}>
      <PostMeta
        authorAvatar={quote.author.avatar}
        authorHandle={quote.author.handle}
        authorDisplayName={quote.author.displayName}
        postHref={itemHref}
        timestamp={quote.indexedAt}
      />
      <Text type="post-text" style={pal.text} numberOfLines={6}>
        {isEmpty ? (
          <Text style={pal.link} lineHeight={1.5}>
            View post
          </Text>
        ) : (
          quote.text
        )}
      </Text>
      {AppBskyEmbedImages.isView(imagesEmbed) && (
        <PostEmbeds embed={imagesEmbed} />
      )}
      {AppBskyEmbedRecordWithMedia.isView(imagesEmbed) && (
        <PostEmbeds embed={imagesEmbed.media} />
      )}
    </Link>
  )
}

export default QuoteEmbed

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  quotePost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
})
