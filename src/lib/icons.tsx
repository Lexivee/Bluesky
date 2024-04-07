import React from 'react'
import {StyleProp, TextStyle, ViewStyle} from 'react-native'
import Svg, {Ellipse, Line, Path, Rect} from 'react-native-svg'

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MagnifyingGlassIcon({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </Svg>
  )
}

export function MagnifyingGlassIcon2({
  style,
  size,
  strokeWidth = 2,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Ellipse cx="12" cy="10.5" rx="9" ry="9" />
      <Line x1="18.5" y1="17" x2="22" y2="20.5" strokeLinecap="round" />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function UserGroupIcon({
  style,
  size,
}: {
  style?: StyleProp<ViewStyle>
  size?: string | number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      width={size || 32}
      height={size || 32}
      strokeWidth={2}
      stroke="currentColor"
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </Svg>
  )
}

export function RepostIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
        d="M 14.437 18.081 L 5.475 18.095 C 4.7 18.095 4.072 17.467 4.072 16.692 L 4.082 6.65 L 1.22 10.854 M 4.082 6.65 L 7.006 10.854 M 9.859 6.65 L 18.625 6.654 C 19.4 6.654 20.028 7.282 20.028 8.057 L 20.031 18.081 L 17.167 13.646 M 20.031 18.081 L 22.866 13.646"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIcon({
  style,
  size = 24,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth: number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="none"
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

// Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
export function HeartIconSolid({
  style,
  size = 24,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} style={style}>
      <Path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1}
        d="M 3.859 13.537 L 10.918 20.127 C 11.211 20.4 11.598 20.552 12 20.552 C 12.402 20.552 12.789 20.4 13.082 20.127 L 20.141 13.537 C 21.328 12.431 22 10.88 22 9.259 L 22 9.033 C 22 6.302 20.027 3.974 17.336 3.525 C 15.555 3.228 13.742 3.81 12.469 5.084 L 12 5.552 L 11.531 5.084 C 10.258 3.81 8.445 3.228 6.664 3.525 C 3.973 3.974 2 6.302 2 9.033 L 2 9.259 C 2 10.88 2.672 12.431 3.859 13.537 Z"
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function CommentBottomArrow({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  let color = 'currentColor'
  if (
    style &&
    typeof style === 'object' &&
    'color' in style &&
    typeof style.color === 'string'
  ) {
    color = style.color
  }
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 2.5}
      stroke={color}
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </Svg>
  )
}

export function SquareIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="6" width="12" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectWideIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="4" y="6" width="16" height="12" strokeLinejoin="round" />
    </Svg>
  )
}

export function RectTallIcon({
  style,
  size,
  strokeWidth = 1.3,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1}
      stroke="currentColor"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Rect x="6" y="4" width="12" height="16" strokeLinejoin="round" />
    </Svg>
  )
}

export function ComposeIcon2({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      width={size || 24}
      height={size || 24}
      style={style}>
      <Path
        d="M 20 9 L 20 16 C 20 18.209 18.209 20 16 20 L 8 20 C 5.791 20 4 18.209 4 16 L 4 8 C 4 5.791 5.791 4 8 4 L 15 4"
        strokeWidth={strokeWidth}
      />
      <Line
        strokeLinecap="round"
        x1="10"
        y1="14"
        x2="18.5"
        y2="5.5"
        strokeWidth={strokeWidth * 1.5}
      />
      <Line
        strokeLinecap="round"
        x1="20.5"
        y1="3.5"
        x2="21"
        y2="3"
        strokeWidth={strokeWidth * 1.5}
      />
    </Svg>
  )
}

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function ShieldExclamation({
  style,
  size,
  strokeWidth = 1.5,
}: {
  style?: StyleProp<TextStyle>
  size?: string | number
  strokeWidth?: number
}) {
  let color = 'currentColor'
  if (
    style &&
    typeof style === 'object' &&
    'color' in style &&
    typeof style.color === 'string'
  ) {
    color = style.color
  }
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth || 1.5}
      stroke={color}
      style={style}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
      />
    </Svg>
  )
}
