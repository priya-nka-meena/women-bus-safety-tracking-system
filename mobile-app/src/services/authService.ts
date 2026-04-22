import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { User } from "../types";

class AuthService {

  // =========================
  // 🔥 SIGN UP (FIXED)
  // =========================
  async signUp(
    email: string,
    password: string,
    name: string,
    role: "passenger" | "driver",
    aadhaarNumber?: string,
    licenseNumber?: string
  ): Promise<FirebaseUser> {
    console.log("SIGNUP:", { email, role });

    if (!role) throw new Error("Role is required");

    // Aadhaar only for passenger
    if (role === "passenger") {
      if (!aadhaarNumber) throw new Error("Aadhaar required for passenger");

      const res = await this.verifyAadhaar(aadhaarNumber);

      if (!res.valid) {
        throw new Error("Only VERIFIED FEMALE users allowed");
      }
    }

    // License verification for driver
    if (role === "driver") {
      if (!licenseNumber) throw new Error("License required for driver");

      const res = await this.verifyDriverLicense(licenseNumber);

      if (!res.valid) {
        throw new Error("Only VERIFIED MALE drivers allowed");
      }
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: name });

    const userData: User = {
      id: firebaseUser.uid,
      email,
      name,
      role,
      phone: "",
      emergencyContacts: [],
      licenseNumber: role === "driver" ? licenseNumber : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userData);

    console.log("USER CREATED:", role);

    return firebaseUser;
  }

  // =========================
  // LOGIN (FIXED)
  // =========================
  async signIn(email: string, password: string): Promise<User> {
    console.log("LOGIN:", email);

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    // AUTO FIX MISSING USER DOC
    if (!snap.exists()) {
      const fallback: User = {
        id: uid,
        email,
        name: cred.user.displayName || "",
        role: "passenger", // Default fallback
        phone: "",
        emergencyContacts: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(ref, fallback);
      console.log("AUTO-CREATED USER DOC:", fallback.role);
      return fallback;
    }

    let data = snap.data() as User;

    // FIX MISSING ROLE
    if (!data.role) {
      // Try to determine role from license number if exists
      if (data.licenseNumber) {
        const licenseCheck = await this.verifyDriverLicense(data.licenseNumber);
        if (licenseCheck.valid) {
          data.role = "driver";
          console.log("AUTO-ASSIGNED DRIVER ROLE FROM LICENSE");
        } else {
          data.role = "passenger";
        }
      } else {
        data.role = "passenger";
      }
      
      await updateDoc(ref, { role: data.role });
      console.log("AUTO-FIXED ROLE:", data.role);
    }

    return data;
  }

  // =========================
  // CURRENT USER
  // 🔥 CURRENT USER
  // =========================
  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        unsub();

        if (!firebaseUser) return resolve(null);

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) return resolve(null);

        resolve(snap.data() as User);
      });
    });
  }

  // =========================
  // 🔥 SIGN OUT
  // =========================
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  // =========================
  // 🔥 AADHAAR VERIFY (FIXED)
  // =========================
  async verifyAadhaar(aadhaarNumber: string): Promise<{
    valid: boolean;
    name: string;
    gender: string;
  }> {
    console.log("AADHAAR:", aadhaarNumber);

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return { valid: false, name: "", gender: "" };
    }

    const ref = doc(db, "aadhaar_users", aadhaarNumber);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { valid: false, name: "", gender: "" };
    }

    const data = snap.data();

    const gender = (data.gender || "").toLowerCase();

    const valid =
      data.verified === true &&
      gender === "female";

    return {
      valid,
      name: valid ? data.name : "",
      gender
    };
  }

  // =========================
  // DRIVER LICENSE VERIFICATION
  // =========================
  async verifyDriverLicense(licenseNumber: string): Promise<{
    valid: boolean;
    name: string;
    gender: string;
    expiryDate?: string;
    assignedBus?: string;
  }> {
    console.log("DRIVER LICENSE VERIFICATION:", licenseNumber);

    if (!licenseNumber || licenseNumber.length < 8) {
      return { valid: false, name: "", gender: "" };
    }

    const ref = doc(db, "driver_licenses", licenseNumber);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("LICENSE NOT FOUND:", licenseNumber);
      return { valid: false, name: "", gender: "" };
    }

    const data = snap.data();
    console.log("LICENSE DATA:", data);

    const gender = (data.gender || "").toLowerCase();

    // Driver must be male and verified
    const valid =
      data.verified === true &&
      gender === "male";

    console.log("LICENSE VALIDATION:", { valid, gender, verified: data.verified });

    return {
      valid,
      name: valid ? data.name : "",
      gender,
      expiryDate: data.expiryDate,
      assignedBus: data.assignedBus
    };
  }

  // =========================
  // UPDATE USER PROFILE
  // =========================
  async updateUser(userId: string, updates: Partial<User>) {
    console.log("UPDATING USER:", { userId, updates });
    
    try {
      await updateDoc(doc(db, "users", userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log("USER UPDATED SUCCESSFULLY");
    } catch (error) {
      console.log("UPDATE USER ERROR:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>) {
    return this.updateUser(userId, updates);
  }

  // =========================
  // ROLE SETTER (optional)
  // =========================
  async setUserRole(userId: string, role: "passenger" | "driver") {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: serverTimestamp()
    });
  }
}

export default new AuthService();