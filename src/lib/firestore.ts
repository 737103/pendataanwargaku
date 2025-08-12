
import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc, updateDoc, limit } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string; // Password should not be stored in plain text in a real app
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  nik: string;
  phone: string;
  address: string;
};

export type Citizen = {
  id: string;
  name: string;
  address: string;
  contactInfo: string;
  documents: string[];
  username: string;
  gender: 'Laki-laki' | 'Perempuan';
  nik: string;
  kkNumber: string;
  occupation: string;
  lastEducation: string;
  religion: string;
  maritalStatus: string;
  familyRelationship: string;
  familyMembersCount: number;
  bloodType: string;
  rt: string;
  rw: string;
};

export type InputStats = {
    username: string;
    count: number;
    isComplete?: boolean;
}

// --- Seeding function to create a default admin user ---
async function ensureDefaultAdminExists() {
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'), limit(1));
    const querySnapshot = await getDocs(adminQuery);

    if (querySnapshot.empty) {
        console.log("No admin user found. Creating a default admin...");
        const defaultAdmin: Omit<User, 'id'> = {
            name: 'Admin Utama',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            nik: '0000000000000000',
            phone: '000000000000',
            address: 'Kantor Pusat',
        };
        try {
            await addDoc(usersRef, defaultAdmin);
            console.log('Default admin user created successfully.');
        } catch (error) {
            console.error('Error creating default admin user:', error);
        }
    }
}

// Call the seeding function once when the module is loaded.
ensureDefaultAdminExists();
// ---------------------------------------------------------


export async function verifyUserCredentials(username: string, password_input: string): Promise<Omit<User, 'password'> | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null; // User not found
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    // IMPORTANT: In a real application, NEVER store passwords in plain text.
    // Always hash passwords on the server-side and compare the hash.
    // This is a simplified example for demonstration purposes.
    if (user.password === password_input) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    return null; // Password incorrect
}

export async function getUserFromUsername(username: string): Promise<User | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function getUsers(): Promise<User[]> {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function addUser(user: Omit<User, 'id'>): Promise<void> {
    const usersCollection = collection(db, 'users');
    await addDoc(usersCollection, user);
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    // Remove undefined values to avoid overwriting fields with nothing
    const cleanUserData: { [key: string]: any } = {};
    Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanUserData[key] = value;
        }
    });
    
    // Specifically allow empty password string to not be written
    if (userData.password === '' || userData.password === undefined) {
        delete cleanUserData.password;
    }

    await updateDoc(userDocRef, cleanUserData);
}

export async function deleteUser(userId: string): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
}


export async function getCitizens(): Promise<Citizen[]> {
    const citizensCollection = collection(db, 'citizens');
    const snapshot = await getDocs(citizensCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Citizen));
}

export async function getCitizensByUsername(username: string): Promise<Citizen[]> {
    const citizensCollection = collection(db, 'citizens');
    const q = query(citizensCollection, where('username', '==', username));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Citizen));
}

export async function addCitizen(citizen: Omit<Citizen, 'id'>): Promise<void> {
    const citizensCollection = collection(db, 'citizens');
    await addDoc(citizensCollection, citizen);
}

export async function updateCitizen(citizenId: string, citizenData: Partial<Omit<Citizen, 'id' | 'username'>>): Promise<void> {
    const citizenDocRef = doc(db, 'citizens', citizenId);
    await updateDoc(citizenDocRef, citizenData);
}

export async function deleteCitizen(citizenId: string): Promise<void> {
    const citizenDocRef = doc(db, 'citizens', citizenId);
    await deleteDoc(citizenDocRef);
}

export async function isNikExists(nik: string, excludeId?: string): Promise<boolean> {
    const citizensCollection = collection(db, 'citizens');
    const q = query(citizensCollection, where('nik', '==', nik), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return false;
    }

    if (excludeId) {
        // If we are checking during an update, make sure the found document is not the one we are currently editing
        const docId = snapshot.docs[0].id;
        return docId !== excludeId;
    }

    return true; // Found a document, and we are not in an update context
}

export async function getCitizenByKkNumber(kkNumber: string): Promise<Citizen | null> {
    if (!kkNumber || kkNumber.length !== 16) {
        return null;
    }
    const citizensCollection = collection(db, 'citizens');
    const q = query(citizensCollection, where('kkNumber', '==', kkNumber), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const citizenDoc = snapshot.docs[0];
    return { id: citizenDoc.id, ...citizenDoc.data() } as Citizen;
}

export async function getDashboardStats() {
    const citizens = await getCitizens();

    const totalSouls = citizens.length;
    const totalMale = citizens.filter(c => c.gender === 'Laki-laki').length;
    const totalFemale = citizens.filter(c => c.gender === 'Perempuan').length;
    const totalKK = new Set(citizens.map(c => c.kkNumber)).size;

    const citizensByUser: Record<string, Citizen[]> = {};
    for (const citizen of citizens) {
        if (!citizensByUser[citizen.username]) {
            citizensByUser[citizen.username] = [];
        }
        citizensByUser[citizen.username].push(citizen);
    }
    
    const familiesMap = new Map<string, { members: Citizen[], head?: Citizen }>();
    for (const citizen of citizens) {
        if (!familiesMap.has(citizen.kkNumber)) {
            familiesMap.set(citizen.kkNumber, { members: [], head: undefined });
        }
        const family = familiesMap.get(citizen.kkNumber)!;
        family.members.push(citizen);
        if (citizen.familyRelationship === 'Kepala Keluarga') {
            family.head = citizen;
        }
    }

    const inputStats: InputStats[] = Object.entries(citizensByUser).map(([username, userCitizens]) => {
        // Check if all families touched by this user are complete
        const userKkNumbers = new Set(userCitizens.map(c => c.kkNumber));
        let allFamiliesCompleteForUser = true;
        for (const kkNumber of userKkNumbers) {
            const familyData = familiesMap.get(kkNumber);
            if (familyData && familyData.head) {
                if (familyData.members.length < familyData.head.familyMembersCount) {
                    allFamiliesCompleteForUser = false;
                    break; // One incomplete family is enough to mark user as not complete
                }
            } else {
                 // If there's no head for a family, we can't determine completeness.
                 // We can either mark as incomplete or ignore. Let's mark as incomplete.
                 allFamiliesCompleteForUser = false;
                 break;
            }
        }
        
        return {
            username,
            count: userCitizens.length,
            isComplete: allFamiliesCompleteForUser
        }
    }).sort((a,b) => b.count - a.count);

    let pendingMembers = 0;
    for (const familyData of familiesMap.values()) {
        if (familyData.head) {
            const expectedCount = familyData.head.familyMembersCount;
            const currentCount = familyData.members.length;
            if (currentCount < expectedCount) {
                pendingMembers += (expectedCount - currentCount);
            }
        }
    }


    return {
        totalSouls,
        totalKK,
        totalMale,
        totalFemale,
        pendingMembers,
        inputStats,
    };
}

export async function getUserDashboardStats(username: string) {
    const citizens = await getCitizensByUsername(username);
  
    const totalSouls = citizens.length;
    const totalMale = citizens.filter((c) => c.gender === 'Laki-laki').length;
    const totalFemale = citizens.filter((c) => c.gender === 'Perempuan').length;
    const totalKK = new Set(citizens.map((c) => c.kkNumber)).size;
  
    const familiesMap = new Map<string, { members: Citizen[]; head?: Citizen }>();
    for (const citizen of citizens) {
      if (!familiesMap.has(citizen.kkNumber)) {
        familiesMap.set(citizen.kkNumber, { members: [], head: undefined });
      }
      const family = familiesMap.get(citizen.kkNumber)!;
      family.members.push(citizen);
      if (citizen.familyRelationship === 'Kepala Keluarga') {
        family.head = citizen;
      }
    }
  
    let membersEntered = 0;
    let membersPending = 0;
    
    // We need all citizens to accurately calculate pending members for a KK
    const allCitizens = await getCitizens();
    const allCitizensByKk = allCitizens.reduce((acc, citizen) => {
        if (!acc[citizen.kkNumber]) {
            acc[citizen.kkNumber] = [];
        }
        acc[citizen.kkNumber].push(citizen);
        return acc;
    }, {} as Record<string, Citizen[]>);


    for (const familyData of familiesMap.values()) {
        // Find head of family from the all citizens list to get the correct familyMembersCount
        const headOfFamily = allCitizensByKk[familyData.members[0].kkNumber]?.find(
            (c) => c.familyRelationship === 'Kepala Keluarga'
        );

        if (headOfFamily) {
            const expectedCount = headOfFamily.familyMembersCount;
            const currentCount = allCitizensByKk[headOfFamily.kkNumber]?.length || 0;
            
            membersEntered += currentCount;
            const pending = expectedCount - currentCount;
            if (pending > 0) {
                 membersPending += pending;
            }
        } else {
             // If the head of the family wasn't entered by this user, we can count the members they did enter.
             membersEntered += familyData.members.length;
        }
    }

    // To avoid double counting when calculating total entered
    const totalEntered = new Set(citizens.map(c => c.id)).size;
    const totalPending = membersPending;
  
    const completionData = [
      { name: 'Telah Diinput', value: totalEntered, color: 'hsl(var(--primary))' },
      { name: 'Belum Diinput', value: totalPending, color: 'hsl(var(--destructive))' },
    ];
  
    return {
      totalSouls,
      totalKK,
      totalMale,
      totalFemale,
      completionData,
    };
}
