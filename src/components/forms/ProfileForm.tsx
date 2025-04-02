"use client";

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  updateProfile,
} from "@/lib/firebase/config";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userDetails, setUserDetails] = useState<{
    email: string | null;
    emailVerified: boolean;
  }>({
    email: user.email,
    emailVerified: user.emailVerified,
  });
  const router = useRouter();

  // Load profile image from Firestore on component mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        // First check if user has Google profile photo
        if (user.photoURL) {
          setProfileImage(user.photoURL);
        }

        // Check if user has a custom profile image in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profileImage) {
          setProfileImage(userDoc.data().profileImage);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfileImage();

    // Update user details if they change (e.g. on email verification)
    setUserDetails({
      email: user.email,
      emailVerified: user.emailVerified,
    });
  }, [user]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or GIF file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const base64String = e.target?.result as string;
      setProfileImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Update display name in Firebase Auth
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      // Create or update user document in Firestore with profile image
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          displayName,
          profileImage: profileImage || user.photoURL || null,
          lastUpdated: new Date(),
        });
      } else {
        // Create new document
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName,
          profileImage: profileImage || user.photoURL || null,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      }

      // Update local user details
      setUserDetails({
        email: user.email,
        emailVerified: user.emailVerified,
      });

      toast.success("Profile updated successfully!");

      // Redirect to dashboard to see updated profile in the UserProfile component
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "U";
  };

  // Image component for handling both remote URLs and base64 data
  const ProfileImageComponent = () => {
    if (!profileImage) {
      return (
        <div className="w-[120px] h-[120px] rounded-full bg-[#E50046] flex items-center justify-center text-white text-3xl font-bold">
          {getInitials()}
        </div>
      );
    }

    // Check if the image is a base64 string
    if (profileImage.startsWith("data:image")) {
      return (
        <div className="w-[120px] h-[120px] relative">
          <Image
            src={profileImage}
            alt="Profile"
            width={120}
            height={120}
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>
      );
    }

    // Otherwise use Next.js Image component for remote URLs
    return (
      <div className="w-[120px] h-[120px] relative">
        <Image
          src={profileImage}
          alt="Profile"
          width={120}
          height={120}
          className="rounded-full object-cover border-4 border-white  shadow-md"
        />
      </div>
    );
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto bg-white  rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className="px-6 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 ">
            Account Information
          </h2>
        </div>

        <div className="flex flex-col items-center mb-6">
          <motion.div
            className="relative mb-4 group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}>
            <ProfileImageComponent />

            <motion.button
              type="button"
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-white  rounded-full p-2 shadow-md hover:bg-gray-100  transition-all duration-200"
              aria-label="Upload profile picture"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 "
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
          </motion.div>

          <p className="text-sm text-gray-500 ">
            JPG, PNG or GIF, max 5MB
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 ">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={userDetails.email || ""}
              disabled
              className="mt-1 block w-full disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 ">
              Email verification status:{" "}
              {userDetails.emailVerified ? (
                <span className="text-green-600 ">
                  Verified ✓
                </span>
              ) : (
                <span className="text-red-600 ">
                  Not verified ✗
                </span>
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 ">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={handleDisplayNameChange}
              className="mt-1 block w-full"
              placeholder="Enter your display name"
            />
          </div>

          <motion.div className="flex justify-end" whileHover={{ scale: 1.02 }}>
            <Button type="submit" disabled={isUpdating} loading={isUpdating}>
              Update Profile
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
