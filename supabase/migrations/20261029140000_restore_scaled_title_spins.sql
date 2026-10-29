-- Restore scaled spin rewards for achievement titles.
-- A spin type that existed before the 10x reduction keeps at least one spin.
-- Larger original rewards remain scaled down (e.g. 50 free spins -> 5).
begin;

update public.mb_achievement_title_reward_catalog
set
    reward_free_spins = case title_id
        when 'wave_100' then 0
        when 'boss_hunter' then 1
        when 'collector' then 1
        when 'champion' then 1
        when 'reborn' then 1
        when 'multiverse_legend' then 2
        when 'wave_200' then 0
        when 'wave_300' then 1
        when 'wave_500' then 0
        when 'wave_750' then 1
        when 'wave_1500' then 0
        when 'wave_2000' then 2
        when 'wave_5000' then 0
        when 'wave_10000' then 5
        when 'bosses_1' then 0
        when 'bosses_5' then 1
        when 'bosses_25' then 1
        when 'bosses_50' then 0
        when 'bosses_100' then 0
        when 'bosses_250' then 1
        when 'bosses_500' then 2
        when 'wins_1' then 0
        when 'wins_50' then 1
        when 'wins_100' then 0
        when 'wins_250' then 1
        when 'wins_500' then 0
        when 'wins_1000' then 0
        when 'cards_100' then 1
        when 'cards_250' then 1
        when 'cards_500' then 1
        when 'cards_1000' then 2
        when 'rebirth_1' then 0
        when 'rebirth_10' then 1
        when 'rebirth_25' then 0
        when 'rebirth_50' then 2
        when 'rebirth_100' then 0
        when 'clicks_1000' then 0
        when 'clicks_10000' then 1
        when 'clicks_50000' then 1
        when 'clicks_100000' then 0
        when 'clicks_1000000' then 0
        when 'multiverse_parasite' then 2
        when 'overqualified' then 1
        when 'rebirth_loop' then 2
        when 'card_singularity' then 2
        when 'final_chairman' then 5
        else 0
    end,
    reward_legendary_spins = case title_id
        when 'wave_100' then 0
        when 'boss_hunter' then 1
        when 'collector' then 0
        when 'champion' then 1
        when 'reborn' then 0
        when 'multiverse_legend' then 1
        when 'wave_200' then 0
        when 'wave_300' then 0
        when 'wave_500' then 1
        when 'wave_750' then 0
        when 'wave_1500' then 1
        when 'wave_2000' then 1
        when 'wave_5000' then 1
        when 'wave_10000' then 2
        when 'bosses_1' then 0
        when 'bosses_5' then 0
        when 'bosses_25' then 1
        when 'bosses_50' then 1
        when 'bosses_100' then 1
        when 'bosses_250' then 1
        when 'bosses_500' then 2
        when 'wins_1' then 0
        when 'wins_50' then 0
        when 'wins_100' then 1
        when 'wins_250' then 1
        when 'wins_500' then 1
        when 'wins_1000' then 1
        when 'cards_100' then 0
        when 'cards_250' then 0
        when 'cards_500' then 1
        when 'cards_1000' then 1
        when 'rebirth_1' then 0
        when 'rebirth_10' then 0
        when 'rebirth_25' then 1
        when 'rebirth_50' then 1
        when 'rebirth_100' then 2
        when 'clicks_1000' then 0
        when 'clicks_10000' then 0
        when 'clicks_50000' then 0
        when 'clicks_100000' then 1
        when 'clicks_1000000' then 1
        when 'multiverse_parasite' then 1
        when 'overqualified' then 1
        when 'rebirth_loop' then 1
        when 'card_singularity' then 1
        when 'final_chairman' then 2
        else 0
    end,
    reward_secret_spins = case title_id
        when 'wave_100' then 0
        when 'boss_hunter' then 0
        when 'collector' then 0
        when 'champion' then 0
        when 'reborn' then 0
        when 'multiverse_legend' then 1
        when 'wave_200' then 0
        when 'wave_300' then 0
        when 'wave_500' then 0
        when 'wave_750' then 0
        when 'wave_1500' then 0
        when 'wave_2000' then 0
        when 'wave_5000' then 1
        when 'wave_10000' then 1
        when 'bosses_1' then 0
        when 'bosses_5' then 0
        when 'bosses_25' then 0
        when 'bosses_50' then 0
        when 'bosses_100' then 0
        when 'bosses_250' then 1
        when 'bosses_500' then 1
        when 'wins_1' then 0
        when 'wins_50' then 0
        when 'wins_100' then 0
        when 'wins_250' then 0
        when 'wins_500' then 0
        when 'wins_1000' then 1
        when 'cards_100' then 0
        when 'cards_250' then 0
        when 'cards_500' then 0
        when 'cards_1000' then 1
        when 'rebirth_1' then 0
        when 'rebirth_10' then 0
        when 'rebirth_25' then 0
        when 'rebirth_50' then 0
        when 'rebirth_100' then 1
        when 'clicks_1000' then 0
        when 'clicks_10000' then 0
        when 'clicks_50000' then 0
        when 'clicks_100000' then 0
        when 'clicks_1000000' then 1
        when 'multiverse_parasite' then 1
        when 'overqualified' then 1
        when 'rebirth_loop' then 1
        when 'card_singularity' then 1
        when 'final_chairman' then 1
        else 0
    end
where title_id in ('wave_100', 'boss_hunter', 'collector', 'champion', 'reborn', 'multiverse_legend', 'wave_200', 'wave_300', 'wave_500', 'wave_750', 'wave_1500', 'wave_2000', 'wave_5000', 'wave_10000', 'bosses_1', 'bosses_5', 'bosses_25', 'bosses_50', 'bosses_100', 'bosses_250', 'bosses_500', 'wins_1', 'wins_50', 'wins_100', 'wins_250', 'wins_500', 'wins_1000', 'cards_100', 'cards_250', 'cards_500', 'cards_1000', 'rebirth_1', 'rebirth_10', 'rebirth_25', 'rebirth_50', 'rebirth_100', 'clicks_1000', 'clicks_10000', 'clicks_50000', 'clicks_100000', 'clicks_1000000', 'multiverse_parasite', 'overqualified', 'rebirth_loop', 'card_singularity', 'final_chairman');

commit;
