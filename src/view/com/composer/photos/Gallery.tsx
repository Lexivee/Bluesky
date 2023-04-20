import React, {useCallback} from 'react'
import {ImageStyle, TextStyle} from 'react-native'
import {GalleryModel} from 'state/models/media/gallery'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from 'lib/styles'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {ImageModel} from 'state/models/media/image'
import {Image} from 'expo-image'
import {Text} from 'view/com/util/text/Text'

interface Props {
  gallery: GalleryModel
}

export const Gallery = observer(function ({gallery}: Props) {
  const getImageStyle = useCallback(() => {
    switch (gallery.size) {
      case 1:
        return styles.image250
      case 2:
        return styles.image175
      default:
        return styles.image85
    }
  }, [gallery])

  const imageStyle = getImageStyle()
  const handleAddImageAltText = useCallback(
    (image: ImageModel) => {
      gallery.setAltText(image)
    },
    [gallery],
  )
  const handleRemovePhoto = useCallback(
    (image: ImageModel) => {
      gallery.remove(image)
    },
    [gallery],
  )

  const handleEditPhoto = useCallback(
    (image: ImageModel) => {
      gallery.crop(image)
    },
    [gallery],
  )

  return !gallery.isEmpty ? (
    <View testID="selectedPhotosView" style={styles.gallery}>
      {gallery.images.map(image =>
        image.compressed !== undefined ? (
          <View
            key={`selected-image-${image.path}`}
            style={[styles.imageContainer, imageStyle]}>
            <View style={styles.imageControls}>
              <TouchableOpacity
                testID="altTextButton"
                onPress={() => {
                  handleAddImageAltText(image)
                }}
                style={[styles.imageControl, styles.imageControlLabel]}>
                <Text style={styles.imageControlTextContent}>ALT</Text>
              </TouchableOpacity>
              <View style={styles.imageControlsSubgroupRight}>
                <TouchableOpacity
                  testID="cropPhotoButton"
                  onPress={() => {
                    handleEditPhoto(image)
                  }}
                  style={styles.imageControl}>
                  <FontAwesomeIcon
                    icon="pen"
                    size={12}
                    style={{color: colors.white}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID="removePhotoButton"
                  onPress={() => handleRemovePhoto(image)}
                  style={styles.imageControl}>
                  <FontAwesomeIcon
                    icon="xmark"
                    size={16}
                    style={{color: colors.white}}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Image
              testID="selectedPhotoImage"
              style={[styles.image, imageStyle] as ImageStyle}
              source={{
                uri: image.compressed.path,
              }}
            />
          </View>
        ) : null,
      )}
    </View>
  ) : null
})

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
  },
  imageContainer: {
    margin: 2,
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
  },
  image250: {
    width: 250,
    height: 250,
  },
  image175: {
    width: 175,
    height: 175,
  },
  image85: {
    width: 85,
    height: 85,
  },
  imageControls: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 8,
    width: '100%',
    zIndex: 1,
  },
  imageControlsSubgroupRight: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  imageControl: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageControlLabel: {
    borderRadius: 5,
    paddingHorizontal: 10,
    width: 'initial',
  },
  imageControlTextContent: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: '0.05em' as TextStyle,
  } as TextStyle,
})
