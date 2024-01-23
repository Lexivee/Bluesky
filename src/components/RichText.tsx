import React from 'react'
import {RichText as RichTextAPI, AppBskyRichtextFacet} from '@atproto/api'

import {atoms as a, TextStyleProp} from '#/alf'
import {InlineLink} from '#/components/Link'
import {Text} from '#/components/Typography'
import {toShortUrl} from 'lib/strings/url-helpers'
import {getAgent} from '#/state/session'

const WORD_WRAP = {wordWrap: 1}

export function RichText({
  testID,
  value,
  style,
  numberOfLines,
}: TextStyleProp & {
  value: RichTextAPI | string
  testID?: string
  numberOfLines?: number
}) {
  const detected = React.useRef(false)
  const [richText, setRichText] = React.useState<RichTextAPI>(
    value instanceof RichTextAPI ? value : new RichTextAPI({text: value}),
  )

  React.useEffect(() => {
    async function detectFacets() {
      const rt = new RichTextAPI({text: richText.text})
      await rt.detectFacets(getAgent())
      setRichText(rt)
    }

    if (!detected.current) {
      detected.current = true
      detectFacets()
    }
  }, [richText, setRichText])

  const {text, facets} = richText

  if (!facets?.length) {
    if (/^\p{Extended_Pictographic}+$/u.test(text) && text.length <= 5) {
      return (
        <Text
          testID={testID}
          style={[
            {
              fontSize: 26,
              lineHeight: 30,
            },
          ]}
          // @ts-ignore web only -prf
          dataSet={WORD_WRAP}>
          {text}
        </Text>
      )
    }
    return (
      <Text
        testID={testID}
        style={[a.leading_normal, style]}
        numberOfLines={numberOfLines}
        // @ts-ignore web only -prf
        dataSet={WORD_WRAP}>
        {text}
      </Text>
    )
  }

  const els = []
  let key = 0
  // N.B. must access segments via `richText.segments`, not via destructuring
  for (const segment of richText.segments()) {
    const link = segment.link
    const mention = segment.mention
    if (mention && AppBskyRichtextFacet.validateMention(mention).success) {
      els.push(
        <InlineLink
          key={key}
          to={`/profile/${mention.did}`}
          style={[a.leading_normal, style, {pointerEvents: 'auto'}]}
          // @ts-ignore TODO
          dataSet={WORD_WRAP}>
          {segment.text}
        </InlineLink>,
      )
    } else if (link && AppBskyRichtextFacet.validateLink(link).success) {
      els.push(
        <InlineLink
          key={key}
          to={link.uri}
          style={[a.leading_normal, style, {pointerEvents: 'auto'}]}
          // @ts-ignore TODO
          dataSet={WORD_WRAP}
          warnOnMismatchingLabel>
          {toShortUrl(segment.text)}
        </InlineLink>,
      )
    } else {
      els.push(segment.text)
    }
    key++
  }

  return (
    <Text
      testID={testID}
      style={[a.leading_normal, style]}
      numberOfLines={numberOfLines}
      // @ts-ignore web only -prf
      dataSet={WORD_WRAP}>
      {els}
    </Text>
  )
}
