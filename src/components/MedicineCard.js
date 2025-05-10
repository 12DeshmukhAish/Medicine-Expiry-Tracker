import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { getExpiryStatus, daysUntilExpiry } from '../utils/dateUtils';

const MedicineCard = ({ medicine, onPress }) => {
  const days = daysUntilExpiry(medicine.expiryDate);
  const expiryStatus = getExpiryStatus(medicine.expiryDate);
  
  const getStatusColor = () => {
    switch (expiryStatus.status) {
      case 'expired':
        return '#ff3b30'; // Red for expired
      case 'critical':
        return '#ff9500'; // Orange for critical (soon to expire)
      case 'warning':
        return '#ffcc00'; // Yellow for warning
      case 'good':
        return '#34c759'; // Green for good
      default:
        return '#8e8e93'; // Gray for unknown
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <Title>{medicine.name}</Title>
        <Paragraph>{medicine.company || 'Unknown company'}</Paragraph>
        <Paragraph>Expiry: {medicine.expiryDate}</Paragraph>
        <Paragraph style={{ color: getStatusColor() }}>
          Status: {expiryStatus.description}
        </Paragraph>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
});

export default MedicineCard;