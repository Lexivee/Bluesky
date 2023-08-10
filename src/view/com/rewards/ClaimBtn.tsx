import { StyleSheet, View } from "react-native";
import { colors, s } from "lib/styles";

import { StarsIcon } from "lib/icons";
import { Text } from "view/com/util/text/Text";
import { TouchableOpacity } from "react-native-gesture-handler";

type ClaimBtnProps = {
  onClick: () => void;
  text?: string;
  loading?: boolean;
  done?: boolean;
  disabled?: boolean;
};

export const ClaimBtn = ({
  onClick,
  text = "Claim Reward",
  loading = false,
  disabled = false,
  done = false,
}: ClaimBtnProps) => {
  return (
    <TouchableOpacity
      disabled={disabled || loading || done}
      onPress={onClick}
      style={[styles.claimBtn, (disabled || loading || done) && {backgroundColor: colors.gray2}]}
    >
      <View style={styles.starIcon}>
        <StarsIcon />
      </View>
      <Text style={styles.claimText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: colors.splx.primary[50],

    marginTop: 4,
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 8,
  },
  claimText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
});
