<script lang="ts">
    import _ from 'lodash'

    import IconTrophySmall from '$lib/icons/IconTrophySmall.svelte'
    import {achievements, maps, save} from '$lib/store'
    import {t} from '$lib/translations'

    $: missingAchievementsInQuests = _(achievements)
        .groupBy('quest')
        .mapValues(function (achievementsForThisQuest) {
            return _.reduce(
                achievementsForThisQuest,
                function (iteratee, achievement) {
                    return iteratee + ($save.achievements.includes(achievement.slug) ? 0 : 1)
                },
                0
            )
        })
        .value()
</script>

<div class="flex flex-col">
    {#each maps as map}
        <button
            on:click={() => {
                let urlParams = new URLSearchParams(window.location.search)
                urlParams.set('m', map.id)
                window.location.search = urlParams
            }}
            class="flex items-center p-2 mb-2 text-xl text-black rounded-md bg-foreground-light hover:bg-background hover:text-foreground group"
        >
            <div class="flex flex-grow p-2 transition-transform group-hover:translate-x-2">{$t(`quests/index.${map.id}`)}</div>
            {#if !missingAchievementsInQuests[map.id]} <IconTrophySmall /> {/if}
        </button>
    {/each}
</div>
