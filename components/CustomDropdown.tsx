import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Menu, TextInput, TouchableRipple } from 'react-native-paper';
import {
  DropdownInputProps,
  DropdownItem,
  Option,
} from 'react-native-paper-dropdown';

type Props = {
  options: Option[];
  value?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  maxMenuHeight?: number;
  menuOffsetDown?: number;
  menuOffsetUp?: number;
  inputStyle?: StyleProp<TextStyle>;
  menuStyle?: StyleProp<ViewStyle>;
  menuContentStyle?: StyleProp<ViewStyle>;
  onSelect?: (value?: string) => void;
};

export function CustomDropdown({
  options,
  value,
  placeholder,
  label,
  disabled = false,
  error = false,
  maxMenuHeight = 250,
  inputStyle,
  menuStyle,
  menuContentStyle,
  onSelect,
  menuOffsetDown= 44,
  menuOffsetUp = 52,
}: Props) {
    
    const { height: windowHeight } = useWindowDimensions();
    const anchorRef = useRef<View>(null);
    const [opensUp, setOpensUp] = useState(false);
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(0);

    const toggleMenu = useCallback(() => {
    if (disabled) {
        return;
    }

    if (visible) {
        setVisible(false);
        return;
    }

    anchorRef.current?.measureInWindow((_x, y, _width, height) => {
        const estimatedMenuHeight = Math.min(
        maxMenuHeight,
        options.length * 48
        );

        const spaceAbove = y;
        const spaceBelow = windowHeight - (y + height);

        const shouldOpenUp =
        spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

        setOpensUp(shouldOpenUp);
        setVisible(true);
    });
    }, [
    disabled,
    visible,
    maxMenuHeight,
    options.length,
    windowHeight,
    ]);
  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value]
  );

  

  const handleSelect = useCallback(
    (selectedValue?: string) => {
      const nextValue = selectedValue === value ? undefined : selectedValue;
      onSelect?.(nextValue);
      setVisible(false);
    },
    [onSelect]
  );

  const inputProps: DropdownInputProps = {
    placeholder,
    label,
    selectedLabel,
    mode: 'outlined',
    disabled,
    error,
    rightIcon: (
      <TextInput.Icon
        icon={visible ? 'menu-up' : 'menu-down'}
        pointerEvents="none"
      />
    ),
  };

  const menuOffset = opensUp ? -menuOffsetUp : menuOffsetDown;
  return (
    <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        style={[
            styles.menu,
            {
            width,
            transform: [{ translateY: menuOffset }],
            },
            menuStyle,
        ]}
        contentStyle={[styles.menuContent, menuContentStyle]}
        statusBarHeight={
            Platform.OS === 'android' ? StatusBar.currentHeight : undefined
        }
        keyboardShouldPersistTaps="handled"
        anchor={
            <TouchableRipple
            ref={anchorRef}
            disabled={disabled}
            onPress={toggleMenu}
            onLayout={(event) => {
                setWidth(event.nativeEvent.layout.width);
            }}
            >
            <View pointerEvents="none">
                <TextInput
                {...inputProps}
                value={selectedLabel ??''}
                dense
                style={[styles.input, inputStyle]}
                />
            </View>
            </TouchableRipple>
        }
    >
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: maxMenuHeight }}
      >
        {options.map((option, index) => (
          <DropdownItem
            key={option.value}
            option={option}
            value={value}
            width={width}
            toggleMenu={() => setVisible(false)}
            onSelect={handleSelect}
            isLast={index === options.length - 1}
          />
        ))}
      </ScrollView>
    </Menu>
  );
}

const styles = StyleSheet.create({
  menu: {
    marginTop: 4,
  },
  menuContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  input: {
    minHeight: 36,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
});