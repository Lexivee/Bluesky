import React from 'react'
import {useState} from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import {usePalette} from '../../../lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import ExternalLinkEmbed from './ExternalLinkEmbed'

const YoutubeEmbed = ({link, videoId}: {videoId: string}) => {
  const [displayVideoPlayer, setDisplayVideoPlayer] = useState(false)
  const [playerDimensions, setPlayerDimensions] = useState({
    width: 0,
    height: 0,
  })
  const pal = usePalette('default')
  const handlePlayButtonPressed = () => {
    setDisplayVideoPlayer(true)
  }
  const handleOnLayout = event => {
    setPlayerDimensions({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })
  }

  console.log('videoId', videoId)

  if (!displayVideoPlayer) {
    return (
      <View
        style={[styles.extOuter, pal.view, pal.border]}
        href={link.uri}
        onLayout={handleOnLayout}
        noFeedback>
        <ExternalLinkEmbed link={link} onImagePress={handlePlayButtonPressed} />
        <Pressable onPress={handlePlayButtonPressed} style={styles.playButton}>
          <FontAwesomeIcon icon="play" size={24} color="white" />
        </Pressable>
      </View>
    )
  }

  const height = (playerDimensions.width / 16) * 9

  return (
    <TouchableWithoutFeedback>
      <YoutubePlayer
        height={height}
        videoId={videoId}
        webViewStyle={styles.webView}
      />
    </TouchableWithoutFeedback>
  )
}

// TODO: move this out
const styles = StyleSheet.create({
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  playButton: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
    opacity: 0.8,
  },
  webView: {
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
})

export default YoutubeEmbed
