import { useState } from 'nuxt/app';

export const useStatsPanel = () => {
    const provokesOpenned = useState<boolean>('statsPanel-provokes-openned', () => false);
    const extraDefenseOpened = useState<boolean>('statsPanel-extra-defense-openned', () => false);

    const toggleProvokes = () => {
        provokesOpenned.value = !provokesOpenned.value;
        if (provokesOpenned.value) {
            extraDefenseOpened.value = false;
        }
    };

    const toggleExtraDefense = () => {
        extraDefenseOpened.value = !extraDefenseOpened.value;
        if (extraDefenseOpened.value) {
            provokesOpenned.value = false;
        }
    };

    const closeAll = () => {
        provokesOpenned.value = false;
        extraDefenseOpened.value = false;
    };

    return {
        provokesOpenned,
        extraDefenseOpened,
        toggleProvokes,
        toggleExtraDefense,
        closeAll,
    };
};
