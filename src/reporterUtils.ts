import { doc, getDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

export interface Reporter {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: any;
  uid: string;
  isTrusted?: boolean;
  trustLevel?: number; // 0-100
  reportCount?: number;
  verifiedReports?: number;
  falseReports?: number;
  trustReason?: string;
  flagged?: boolean; // Indicates if user is flagged for suspicious activity
  flagReason?: string; // Reason for flagging
}

// Trust level thresholds
export const TRUST_LEVELS = {
  NEW: 0,
  BASIC: 20,
  RELIABLE: 50,
  TRUSTED: 80,
  VERIFIED: 100
};

// Get trust level label based on numeric value
export const getTrustLevelLabel = (trustLevel: number = 0): string => {
  if (trustLevel >= TRUST_LEVELS.VERIFIED) return 'Verified';
  if (trustLevel >= TRUST_LEVELS.TRUSTED) return 'Trusted';
  if (trustLevel >= TRUST_LEVELS.RELIABLE) return 'Reliable';
  if (trustLevel >= TRUST_LEVELS.BASIC) return 'Basic';
  return 'New';
};

// Get trust level color based on numeric value
export const getTrustLevelColor = (trustLevel: number = 0): string => {
  if (trustLevel >= TRUST_LEVELS.VERIFIED) return '#8e24aa'; // Purple
  if (trustLevel >= TRUST_LEVELS.TRUSTED) return '#2e7d32'; // Green
  if (trustLevel >= TRUST_LEVELS.RELIABLE) return '#0288d1'; // Blue
  if (trustLevel >= TRUST_LEVELS.BASIC) return '#fb8c00'; // Orange
  return '#757575'; // Gray
};

// Calculate trust level based on reporter metrics
export const calculateTrustLevel = (
  reportCount: number = 0,
  verifiedReports: number = 0,
  falseReports: number = 0,
  createdAt: any = null
): number => {
  // Time as contributor in days
  const now = new Date();
  const creationDate = createdAt?.toDate?.() || now;
  const daysAsContributor = Math.max(1, Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Base score starts at 10 (new user)
  let trustScore = 10;
  
  // Add points for verified reports (more weight)
  trustScore += Math.min(50, verifiedReports * 5);
  
  // Add points for report accuracy rate
  if (reportCount > 0) {
    const accuracyRate = verifiedReports / reportCount;
    trustScore += Math.round(accuracyRate * 20);
  }
  
  // Add points for tenure (up to 10 points)
  trustScore += Math.min(10, Math.floor(daysAsContributor / 30));
  
  // Subtract points for false reports (heavy penalty)
  trustScore -= Math.min(trustScore - 5, falseReports * 10);
  
  // Ensure trust score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(trustScore)));
};

// Update reporter trust level manually (for admin use)
export const updateReporterTrustManually = async (
  reporterId: string, 
  trustLevel: number,
  trustReason: string = 'Manual adjustment'
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'reporter', reporterId), {
      trustLevel,
      trustReason,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error manually updating reporter trust:', error);
    return false;
  }
};

// Get all reporters from Firestore
export const getAllReporters = async (): Promise<Reporter[]> => {
  try {
    const q = query(collection(db, 'reporter'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reporter[];
  } catch (error) {
    console.error('Error fetching reporters:', error);
    return [];
  }
};

// Recalculate and update trust level for a specific reporter
export const recalculateReporterTrust = async (reporterId: string): Promise<boolean> => {
  try {
    // Get reporter data
    const reporterDoc = await getDoc(doc(db, 'reporter', reporterId));
    if (!reporterDoc.exists()) {
      return false;
    }
    
    const reporterData = reporterDoc.data() as Reporter;
    const { reportCount = 0, verifiedReports = 0, falseReports = 0, createdAt } = reporterData;
    
    // Calculate new trust level
    const newTrustLevel = calculateTrustLevel(reportCount, verifiedReports, falseReports, createdAt);
    
    // Update reporter document
    await updateDoc(doc(db, 'reporter', reporterId), {
      trustLevel: newTrustLevel,
      trustReason: 'Automatic recalculation',
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error recalculating reporter trust:', error);
    return false;
  }
};

// Bulk recalculate trust levels for all reporters
export const recalculateAllReportersTrust = async (): Promise<number> => {
  try {
    const reporters = await getAllReporters();
    let updatedCount = 0;
    
    for (const reporter of reporters) {
      const success = await recalculateReporterTrust(reporter.id);
      if (success) {
        updatedCount++;
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error recalculating all reporters trust:', error);
    return 0;
  }
};

// Flag/unflag a reporter for suspicious activity
export const updateReporterFlagStatus = async (
  reporterId: string,
  flagged: boolean,
  flagReason: string = ''
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'reporter', reporterId), {
      flagged,
      flagReason: flagged ? flagReason : '',
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating reporter flag status:', error);
    return false;
  }
}; 