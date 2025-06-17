import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sortBy: 'name' | 'ratings' | 'difficulty') => void;
  onReset: () => void;
  currentViewMode: 'grid' | 'list';
  currentSort: 'name' | 'ratings' | 'difficulty';
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  visible,
  onClose,
  onViewModeChange,
  onSortChange,
  onReset,
  currentViewMode,
  currentSort,
}) => {
  const viewModes = [
    { id: 'grid', label: 'Grid', icon: 'grid-outline' },
    { id: 'list', label: 'List', icon: 'list-outline' },
  ];

  const sortOptions = [
    { id: 'name', label: 'Name', icon: 'text-outline' },
    { id: 'ratings', label: 'Rating', icon: 'star-outline' },
    { id: 'difficulty', label: 'Difficulty', icon: 'speedometer-outline' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Options</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={onReset} style={styles.resetButton}>
                <Ionicons name="refresh-outline" size={18} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>

            {/* View Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>View</Text>
              <View style={styles.optionsRow}>
                {viewModes.map(mode => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.optionButton,
                      currentViewMode === mode.id && styles.selectedOption,
                    ]}
                    onPress={() => onViewModeChange(mode.id as any)}
                  >
                    <Ionicons
                      name={mode.icon as any}
                      size={18}
                      color={currentViewMode === mode.id ? '#fff' : '#333'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        currentViewMode === mode.id && styles.selectedOptionText,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort</Text>
              <View style={styles.optionsRow}>
                {sortOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionButton,
                      currentSort === opt.id && styles.selectedOption,
                    ]}
                    onPress={() => onSortChange(opt.id as any)}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={currentSort === opt.id ? '#fff' : '#333'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        currentSort === opt.id && styles.selectedOptionText,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 240,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android elevation
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  resetButton: {
    padding: 4,
  },
  modalBody: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // space-between can stretch items too far if flexWrap, so:
    // justifyContent: 'flex-start',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
  selectedOptionText: {
    color: '#fff',
  },
});

export default OptionsModal;
