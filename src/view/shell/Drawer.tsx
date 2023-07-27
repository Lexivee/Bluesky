import * as fa from "@fortawesome/free-solid-svg-icons";

import {
  BellIcon,
  BellIconSolid,
  HomeIcon,
  HomeIconSolid,
  SolarplexLogo,
  UserIcon,
  UserIconSolid,
} from "lib/icons";
import { CommunitiesIcon, CommunitiesIconSolid } from "../../lib/icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ParamListBase, StackActions, useNavigation } from "@react-navigation/native";
import React, { ComponentProps } from "react";
import { TabState, getTabState } from "lib/routes/helpers";
import { colors, s } from "lib/styles";
import {
  formatCount,
  formatCountShortOnly,
} from "view/com/util/numeric/format";

import { Banner } from "./Banner";
import { FEEDBACK_FORM_URL } from "lib/constants";
import { NavItem } from "./desktop/LeftNav";
import { NavigationProp } from "lib/routes/types";
import { Text } from "view/com/util/text/Text";
import { UserAvatar } from "view/com/util/UserAvatar";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { isWeb } from "platform/detection";
import { observer } from "mobx-react-lite";
import { pluralize } from "lib/strings/helpers";
import { useAnalytics } from "lib/analytics/analytics";
import { useNavigationTabState } from "lib/hooks/useNavigationTabState";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useTheme } from "lib/ThemeContext";

export const DrawerContent = observer(() => {
  const theme = useTheme();
  const pal = usePalette("default");
  const store = useStores();
  const navigation = useNavigation<NavigationProp>();
  const { track } = useAnalytics();
  const { isAtHome, isAtNotifications, isAtMyProfile, isAtCommunities } =
    useNavigationTabState();
  const res = useNavigationTabState();
  const { notifications } = store.me;
  console.log("isAtCommunities", res);
  // events
  // =

  const onPressTab = React.useCallback(
    (tab: string, params?: ParamListBase) => {
      track("Menu:ItemClicked", { url: tab });
      const state = navigation.getState();
      console.log("nav state", state);
      store.shell.closeDrawer();
      if (isWeb) {
        console.log("nav web");
        // @ts-ignore must be Home, Search, Notifications, MyProfile or Communities
        navigation.navigate(tab, params);
      } else {
        console.log("nav non web");
        const tabState = getTabState(state, tab);
        if (tabState === TabState.InsideAtRoot) {
          store.emitScreenSoftReset();
        } else if (tabState === TabState.Inside) {
          navigation.dispatch(StackActions.popToTop());
        } else {
          // @ts-ignore must be Home, Search, Notifications, or MyProfile or Communities
          navigation.navigate(`${tab}Tab`);
        }
      }
    },
    [store, track, navigation],
  );

  const onPressHome = React.useCallback(() => onPressTab("Home"), [onPressTab]);

  const onPressNotifications = React.useCallback(
    () => onPressTab("Notifications"),
    [onPressTab],
  );

  const onPressCommunities = React.useCallback(
    () => onPressTab("Communities"),
    [onPressTab],
  );

  const onPressProfile = React.useCallback(
    () => onPressTab("Profile", {name: store.me.did}),
    [onPressTab],
  );

  const onPressFeedback = React.useCallback(() => {
    track("Menu:FeedbackClicked");
    Linking.openURL(FEEDBACK_FORM_URL);
  }, [track]);

  const onPressSignout = React.useCallback(() => {
    track("Settings:SignOutButtonClicked");
    store.session.logout();
  }, [track, store]);

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[
        styles.view,
        theme.colorScheme === "light" ? pal.view : styles.viewDarkMode,
      ]}
    >
      <SafeAreaView style={s.flex1}>
        {!store.session.isSolarplexSession && (
          <>
            <View style={styles.main}>
              <TouchableOpacity
                testID="profileCardButton"
                accessibilityLabel="Profile"
                accessibilityHint="Navigates to your profile"
                onPress={onPressProfile}
              >
                <UserAvatar size={80} avatar={store.me.avatar} />
                <Text
                  type="title-lg"
                  style={[pal.text, s.bold, styles.profileCardDisplayName]}
                >
                  {store.me.displayName || store.me.handle}
                </Text>
                <Text
                  type="2xl"
                  style={[pal.textLight, styles.profileCardHandle]}
                >
                  @{store.me.handle}
                </Text>
                <Text
                  type="xl"
                  style={[pal.textLight, styles.profileCardFollowers]}
                >
                  <Text type="xl-medium" style={pal.text}>
                    {formatCountShortOnly(store.me.followersCount ?? 0)}
                  </Text>{" "}
                  {pluralize(store.me.followersCount || 0, "follower")} &middot;{" "}
                  <Text type="xl-medium" style={pal.text}>
                    {formatCountShortOnly(store.me.followsCount ?? 0)}
                  </Text>{" "}
                  following
                </Text>
              </TouchableOpacity>
              {/* <WalletMultiButton style={styles.walletConnect}/> */}
            </View>
            {/* <InviteCodes /> */}
          </>
        )}
        <ScrollView style={styles.main}>
          <MenuItem
            icon={
              isAtHome ? (
                <HomeIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              ) : (
                <HomeIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              )
            }
            label="Home"
            accessibilityLabel="Home"
            accessibilityHint=""
            bold={isAtHome}
            onPress={onPressHome}
          />
          {!store.session.isSolarplexSession && (
            <>
              <MenuItem
                icon={
                  <UserIcon
                    size={24}
                    strokeWidth={1.7}
                    style={[pal.text as StyleProp<ViewStyle>]}
                  />
                }
                label="Profile"
                accessibilityLabel="Profile"
                accessibilityHint=""
                bold={isAtMyProfile}
                onPress={onPressProfile}
              />
              <MenuItem
                icon={(isAtCommunities ? <CommunitiesIconSolid/> : <CommunitiesIcon/>)}
                label="Communities"
                accessibilityLabel="Communities"
                accessibilityHint=""
                bold={isAtCommunities}
                onPress={onPressCommunities}
              />
              <MenuItem
                icon={
                  isAtNotifications ? (
                    <BellIconSolid
                      style={pal.text as StyleProp<ViewStyle>}
                      size="24"
                      strokeWidth={1.7}
                    />
                  ) : (
                    <BellIcon
                      style={pal.text as StyleProp<ViewStyle>}
                      size="24"
                      strokeWidth={1.7}
                    />
                  )
                }
                label="Notifications"
                accessibilityLabel="Notifications"
                accessibilityHint={
                  notifications.unreadCountLabel === ""
                    ? ""
                    : `${notifications.unreadCountLabel} unread`
                }
                count={notifications.unreadCountLabel}
                bold={isAtNotifications}
                onPress={onPressNotifications}
              />
            </>
          )}
          {!store.session.hasSession ? (
            // <NavItem
            //   href="/signin"
            //   count={store.me.notifications.unreadCountLabel}
            //   label="Sign in"
            //   icon={<UserIcon />}
            //   iconFilled={<UserIconSolid />}
            // />
            <MenuItem
              icon={<UserIcon />}
              label="Sign in"
              accessibilityLabel="Home"
              accessibilityHint=""
              onPress={() => navigation.navigate("SignIn")}
            />
          ) : (
            <MenuItem
              onPress={onPressSignout}
              icon={
                <FontAwesomeIcon
                  size={22}
                  icon={fa.faSignOut}
                  style={{ ...pal.text, marginLeft: 4 } as FontAwesomeIconStyle}
                />
              }
              label={"Sign Out"}
            />
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Send feedback"
            accessibilityHint="Opens Google Forms feedback link"
            onPress={onPressFeedback}
            style={[
              styles.footerBtn,
              styles.footerBtnFeedback,
              theme.colorScheme === "light"
                ? styles.footerBtnFeedbackLight
                : styles.footerBtnFeedbackDark,
            ]}
          >
            <FontAwesomeIcon
              style={pal.link as FontAwesomeIconStyle}
              size={19}
              icon={["far", "message"]}
            />
            <Text type="2xl-medium" style={[pal.link, s.pl10]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
});

interface MenuItemProps extends ComponentProps<typeof TouchableOpacity> {
  icon: JSX.Element;
  label: string;
  count?: string;
  bold?: boolean;
}

function MenuItem({
  icon,
  label,
  accessibilityLabel,
  count,
  bold,
  onPress,
}: MenuItemProps) {
  const pal = usePalette("default");
  return (
    <TouchableOpacity
      testID={`menuItemButton-${label}`}
      style={styles.menuItem}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint=""
    >
      <View style={[styles.menuItemIconWrapper]}>
        {icon}
        {count ? (
          <View
            style={[
              styles.menuItemCount,
              count.length > 2
                ? styles.menuItemCountHundreds
                : count.length > 1
                ? styles.menuItemCountTens
                : undefined,
            ]}
          >
            <Text style={styles.menuItemCountLabel} numberOfLines={1}>
              {count}
            </Text>
          </View>
        ) : undefined}
      </View>
      <Text
        type={bold ? "2xl-bold" : "2xl"}
        style={[pal.text, s.flex1]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const InviteCodes = observer(() => {
  const { track } = useAnalytics();
  const store = useStores();
  const pal = usePalette("default");
  const { invitesAvailable } = store.me;
  const onPress = React.useCallback(() => {
    track("Menu:ItemClicked", { url: "#invite-codes" });
    store.shell.closeDrawer();
    store.shell.openModal({ name: "invite-codes" });
  }, [store, track]);
  return (
    <TouchableOpacity
      testID="menuItemInviteCodes"
      style={[styles.inviteCodes]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        invitesAvailable === 1
          ? "Invite codes: 1 available"
          : `Invite codes: ${invitesAvailable} available`
      }
      accessibilityHint="Opens list of invite codes"
    >
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          store.me.invitesAvailable > 0 ? pal.link : pal.textLight,
        ]}
        size={18}
      />
      <Text
        type="lg-medium"
        style={store.me.invitesAvailable > 0 ? pal.link : pal.textLight}
      >
        {formatCount(store.me.invitesAvailable)} invite{" "}
        {pluralize(store.me.invitesAvailable, "code")}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 50,
    maxWidth: 300,
  },
  viewDarkMode: {
    backgroundColor: "#1B1919",
  },
  main: {
    paddingLeft: 20,
    paddingTop: 20,
  },
  smallSpacer: {
    height: 20,
  },

  profileCardDisplayName: {
    marginTop: 20,
    paddingRight: 30,
  },
  profileCardHandle: {
    marginTop: 4,
    paddingRight: 30,
  },
  profileCardFollowers: {
    marginTop: 16,
    paddingRight: 10,
  },
  walletConnect: {
    marginTop: 16,
    paddingRight: 24,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 10,
    fontSize: 12,
  },
  menuItemIconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemCount: {
    position: "absolute",
    width: "auto",
    right: -6,
    top: -4,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
  },
  menuItemCountTens: {
    width: 25,
  },
  menuItemCountHundreds: {
    right: -12,
    width: 34,
  },
  menuItemCountLabel: {
    fontSize: 12,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
    color: colors.white,
  },

  inviteCodes: {
    paddingLeft: 22,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inviteCodesIcon: {
    marginRight: 6,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 30,
    paddingTop: 20,
    paddingLeft: 20,
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 25,
  },
  footerBtnFeedback: {
    paddingHorizontal: 24,
  },
  footerBtnFeedbackLight: {
    backgroundColor: "#DDEFFF",
  },
  footerBtnFeedbackDark: {
    backgroundColor: colors.blue6,
  },
});
