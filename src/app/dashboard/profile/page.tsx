"use client";

import ProfileForm from "@/components/forms/ProfileForm";
import DashboardHeader from "@/components/layout/DashboardHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/context/AuthContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Your Profile"
        subtitle="Manage your account information"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center">
          {user ? (
            <ProfileForm user={user} />
          ) : (
            <div className="text-center">
              <p className="text-gray-500 ">
                Please sign in to view your profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
