'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { RefreshCcw } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAchievements } from '@/lib/context/AchievementContext';
import { useHabits } from '@/lib/context/HabitContext';
import { toast } from 'react-hot-toast';

interface AchievementSyncProps {
    className?: string;
}

export default function AchievementSync({ className = '' }: AchievementSyncProps) {
    const [refreshing, setRefreshing] = useState(false);
    const { refreshAchievements, syncWithHabits } = useAchievements();
    const { loading: habitsLoading } = useHabits();

    const handleSync = async () => {
        if (refreshing || habitsLoading) return;

        setRefreshing(true);
        try {
            // First refresh the achievements from Firestore
            await refreshAchievements();

            // Then sync them with the current habit data
            await syncWithHabits();

            toast.success('Achievements synced successfully');
        } catch (error) {
            console.error('Error syncing achievements:', error);
            toast.error('Failed to sync achievements');
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={refreshing || habitsLoading}
            size="sm"
            variant="outline"
            className={className}
        >
            {refreshing ? (
                <LoadingSpinner size="sm" className="mr-2" />
            ) : (
                <RefreshCcw className="w-4 h-4 mr-2" />
            )}
            Sync
        </Button>
    );
} 