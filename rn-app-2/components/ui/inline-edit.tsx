
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import React, { useEffect, useRef, useState } from "react";
import {
    NativeSyntheticEvent,
    StyleSheet,
    TextInput,
    TextInputSubmitEditingEventData,
    View,
} from "react-native";

type InlineEditProps = {
	value: string;
	onCommit: (newValue: string) => void;
	textStyle?: any;
};

export function InlineEdit({ value, onCommit, textStyle }: InlineEditProps) {
	const [editing, setEditing] = useState(false);
	const [inner, setInner] = useState(value);
	const inputRef = useRef<TextInput | null>(null);
	const textColor = useThemeColor({}, "text");

	useEffect(() => {
		setInner(value);
	}, [value]);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
		}
	}, [editing]);

	const commit = (next?: string) => {
		const toCommit = next !== undefined ? next : inner;
		if (toCommit !== value) {
			onCommit(toCommit);
		}
		setEditing(false);
	};

	return (
		<View style={styles.container}>
			{editing ? (
				<TextInput
					ref={inputRef}
					value={inner}
					onChangeText={setInner}
					onBlur={() => commit()}
					onSubmitEditing={(
						e: NativeSyntheticEvent<TextInputSubmitEditingEventData>
					) => commit(e.nativeEvent.text)}
					style={[styles.input, { color: textColor }, textStyle]}
					returnKeyType="done"
					underlineColorAndroid="transparent"
				/>
			) : (
				<ThemedText
					numberOfLines={2}
					ellipsizeMode="middle"
					onPress={() => setEditing(true)}
					style={textStyle}
				>
					{value}
				</ThemedText>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	input: {
		fontSize: 14,
		paddingVertical: 4,
	},
});

export default InlineEdit;
