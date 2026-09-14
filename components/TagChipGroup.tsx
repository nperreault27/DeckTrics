import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Tag } from '@/lib/db';

type Props = {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  multiSelect?: boolean;
};

// Multi-select mode toggles freely (for the post-game comment checkboxes).
// Single-select mode (multiSelect=false) acts like a radio group - used for
// picking one win condition / elimination reason per seat.
export function TagChipGroup({ tags, selectedIds, onChange, multiSelect = true }: Props) {
  const toggle = (id: number) => {
    if (multiSelect) {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id]
      );
    } else {
      onChange(selectedIds.includes(id) ? [] : [id]);
    }
  };

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            onPress={() => toggle(tag.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={selected ? styles.chipTextSelected : styles.chipText}>
              {tag.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { fontSize: 13, color: '#fff' },
});
