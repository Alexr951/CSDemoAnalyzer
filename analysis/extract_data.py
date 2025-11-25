"""
CS2 Demo Analysis - Enhanced Data Extraction
Extracts comprehensive round-by-round data including:
- All CT players in B-Site (not just one anchor)
- Player journeys with timestamps
- Equipment tracking and buy type classification
- Utility usage with throw locations
- Aggregate statistics with conditional filtering
"""

import os
import json
from collections import defaultdict
from awpy import Demo
import polars as pl

# Configuration
DEMO_PATH = r"c:\Users\alexr\OneDrive\Documents\GitHub\CSDemoAnalyzer\Notebooks_Demos\demos\g2-vs-spirit-m3-dust2.dem"
OUTPUT_PATH = r"c:\Users\alexr\OneDrive\Documents\GitHub\CSDemoAnalyzer\web_app\public\data.json"

# B-Site area boundaries
B_SITE_BOUNDS = {
    'min_x': -2264,
    'max_x': -963,
    'min_y': -72,
    'max_y': 1738
}

# Equipment value thresholds for buy classification
BUY_THRESHOLDS = {
    'pistol': 800,      # First round of each half
    'eco': 2000,        # Pistols only
    'light_buy': 3500,  # SMGs with some money left
    'full_buy': 3500    # M4/AWP/FAMAS (anything >= 3500)
}

# Weapon classifications
PISTOLS = ['usp_silencer', 'hkp2000', 'glock', 'p250', 'fiveseven', 'tec9', 'cz75a', 'elite', 'deagle', 'revolver']
SMGS = ['mac10', 'mp9', 'mp7', 'ump45', 'p90', 'bizon']
RIFLES = ['famas', 'm4a1', 'm4a1_silencer', 'ak47', 'aug', 'sg556', 'galilar']
HEAVY = ['awp', 'ssg08', 'scar20', 'g3sg1', 'nova', 'xm1014', 'mag7', 'sawedoff', 'm249', 'negev']

def is_in_b_site_area(x, y):
    """Check if coordinates are within the broad B-Site area"""
    return (B_SITE_BOUNDS['min_x'] <= x <= B_SITE_BOUNDS['max_x'] and 
            B_SITE_BOUNDS['min_y'] <= y <= B_SITE_BOUNDS['max_y'])

def classify_b_site_position(x, y):
    """Classifies the specific position within B-Site based on coordinates."""
    # Back site Tucked (most specific first)
    if -1573 <= x <= -1496 and 1213 <= y <= 1331:
        return "Back site Tucked"
    # Single Barrel
    elif -1951 <= x <= -1843 and 1272 <= y <= 1409:
        return "Single Barrel"
    # Double Barrels
    elif -1974 <= x <= -1847 and 1105 <= y <= 1253:
        return "Double Barrels"
    # Window
    elif -1538 <= x <= -1388 and 1076 <= y <= 1213:
        return "Window"
    # Default
    elif -1592 <= x <= -1484 and 860 <= y <= 1051:
        return "Default"
    # Big Box B Site
    elif -1982 <= x <= -1816 and 885 <= y <= 1081:
        return "Big Box B Site"
    # Back Plat
    elif -2179 <= x <= -1955 and 1385 <= y <= 1718:
        return "Back Plat"
    # Doors
    elif -1511 <= x <= -1337 and 468 <= y <= 752:
        return "Doors"
    # Car B-Site
    elif -1820 <= x <= -1492 and -23 <= y <= 399:
        return "Car B-Site"
    # Tunnel Exit
    elif -2113 <= x <= -1990 and -243 <= y <= 193:
        return "Tunnel Exit"
    # Top Car Box
    elif -1940 <= x <= -1870 and 188 <= y <= 267:
        return "Top Car Box"
    # Close Left
    elif -2217 <= x <= -2113 and 183 <= y <= 301:
        return "Close Left"
    # Second Cubby
    elif -2248 <= x <= -2175 and 502 <= y <= 620:
        return "Second Cubby"
    # General B-Site (less specific)
    elif -1820 <= x <= -1488 and 934 <= y <= 1400:
        return "B-Site General"
    # Whole B-Site (broadest)
    elif is_in_b_site_area(x, y):
        return "B-Site Area"
    
    return "Not in B-Site"

def get_weapon_type(weapon_name):
    """Classify weapon type"""
    if not weapon_name or weapon_name == 'None':
        return 'none'
    weapon_name = weapon_name.lower().replace('weapon_', '')
    
    if weapon_name in PISTOLS:
        return 'pistol'
    elif weapon_name in SMGS:
        return 'smg'
    elif weapon_name in RIFLES:
        return 'rifle'
    elif weapon_name in HEAVY:
        return 'heavy'
    elif weapon_name == 'knife' or 'knife' in weapon_name:
        return 'knife'
    return 'other'

def classify_buy_type(round_num, total_rounds, equipment_value, primary_weapon):
    """
    Classify round buy type based on round number and equipment
    - Pistol: First round of each half (round 1 and round 13)
    - Eco: Equipment value < 2000 or pistol only
    - Light Buy: SMG with value < 3500
    - Full Buy: Value >= 3500 or rifle/AWP
    """
    # Pistol rounds (first round of each half)
    if round_num == 1 or round_num == 13:
        return 'pistol'
    
    weapon_type = get_weapon_type(primary_weapon)
    
    # Eco rounds
    if equipment_value < BUY_THRESHOLDS['eco'] or weapon_type == 'pistol':
        return 'eco'
    
    # Light buy (SMG rounds)
    if weapon_type == 'smg' and equipment_value < BUY_THRESHOLDS['light_buy']:
        return 'light_buy'
    
    # Full buy
    if equipment_value >= BUY_THRESHOLDS['full_buy'] or weapon_type in ['rifle', 'heavy']:
        return 'full_buy'
    
    # Default to eco if we can't determine
    return 'eco'

def extract_player_equipment(ticks_df, round_num, player_name, tick):
    """Extract equipment information for a player at a specific tick"""
    player_tick = ticks_df.filter(
        (pl.col('round_num') == round_num) &
        (pl.col('name') == player_name) &
        (pl.col('tick') == tick)
    )
    
    if len(player_tick) == 0:
        return None
    
    row = player_tick.row(0, named=True)
    
    # Get weapons
    primary = row.get('active_weapon', 'None')
    
    # Calculate equipment value (simplified - you may want to add proper weapon values)
    armor_value = row.get('armor_value', 0)
    has_helmet = row.get('has_helmet', False)
    
    # Simplified equipment value calculation
    equipment_value = 0
    weapon_type = get_weapon_type(primary)
    
    if weapon_type == 'rifle':
        equipment_value += 3000
    elif weapon_type == 'heavy':
        equipment_value += 4000
    elif weapon_type == 'smg':
        equipment_value += 1500
    elif weapon_type == 'pistol':
        equipment_value += 500
    
    if armor_value > 0:
        equipment_value += 650 if has_helmet else 500
    
    return {
        'primary_weapon': primary,
        'armor_value': armor_value,
        'has_helmet': has_helmet,
        'equipment_value': equipment_value,
        'health': row.get('health', 100)
    }

def analyze_player_journey(ticks_df, round_num, player_name, sample_rate=32):
    """
    Analyze a player's journey through B-Site for a specific round
    Returns journey points with timestamps and areas
    """
    # Get all ticks for this player in this round where they're alive
    player_round_ticks = ticks_df.filter(
        (pl.col('round_num') == round_num) &
        (pl.col('name') == player_name) &
        (pl.col('health') > 0)
    ).sort('tick')
    
    if len(player_round_ticks) == 0:
        return []
    
    # Sample every N ticks to reduce data size
    all_ticks = player_round_ticks['tick'].to_list()
    sampled_ticks = [all_ticks[i] for i in range(0, len(all_ticks), sample_rate)]
    
    journey = []
    in_b_site = False
    first_b_site_tick = None
    
    for tick in sampled_ticks:
        tick_data = player_round_ticks.filter(pl.col('tick') == tick)
        if len(tick_data) == 0:
            continue
            
        row = tick_data.row(0, named=True)
        x, y = row['X'], row['Y']
        
        # Check if in B-Site area
        if is_in_b_site_area(x, y):
            if not in_b_site:
                first_b_site_tick = tick
                in_b_site = True
            
            area = classify_b_site_position(x, y)
            journey.append({
                'tick': tick,
                'time': round(tick / 64.0, 2),  # Convert to seconds
                'x': round(x, 1),
                'y': round(y, 1),
                'area': area,
                'is_entry': (tick == first_b_site_tick)
            })
    
    return journey

def extract_grenade_throws(grenades_df, round_num, player_name):
    """Extract grenade throw information for a player in a round"""
    if grenades_df is None or len(grenades_df) == 0:
        return []
    
    # Try to find the correct column for side/team
    side_col = None
    for col in ['thrower_side', 'side', 'thrower_team']:
        if col in grenades_df.columns:
            side_col = col
            break
    
    if side_col is None:
        return []
    
    # Filter for CT grenades from this player in this round
    player_grenades = grenades_df.filter(
        (pl.col('round_num') == round_num) &
        (pl.col('thrower_name') == player_name) &
        (pl.col(side_col).is_in(['CT', 'Counter-Terrorist', 'ct', 3]))  # Handle all CT variations
    )
    
    throws = []
    for row in player_grenades.iter_rows(named=True):
        x, y = row['X'], row['Y']
        
        # Only include throws in or near B-Site
        if is_in_b_site_area(x, y):
            throws.append({
                'tick': row['tick'],
                'time': round(row['tick'] / 64.0, 2),
                'type': row['grenade_type'],
                'x': round(x, 1),
                'y': round(y, 1),
                'area': classify_b_site_position(x, y)
            })
    
    return throws

def main():
    print(f"Loading demo from: {DEMO_PATH}")
    try:
        dem = Demo(DEMO_PATH)
        dem.parse()
    except Exception as e:
        print(f"Error loading demo: {e}")
        return
    
    print("Demo parsed successfully!")
    
    ticks_df = dem.ticks
    total_rounds = ticks_df['round_num'].max()
    print(f"Total rounds in demo: {total_rounds}")
    
    # Debug: Print columns and sides
    print(f"Available columns: {ticks_df.columns}")
    if "side" in ticks_df.columns:
        print(f"Unique sides: {ticks_df['side'].unique().to_list()}")
    if "team_num" in ticks_df.columns:
        print(f"Unique team_nums: {ticks_df['team_num'].unique().to_list()}")
    
    # Determine CT side - awpy uses team_num where 3=CT, 2=T
    # Filter for CT players who are alive
    ct_ticks = None
    if "team_num" in ticks_df.columns:
        # Modern awpy uses team_num
        ct_ticks = ticks_df.filter(
            (pl.col("team_num") == 3) &  # 3 is CT team
            (pl.col("health") > 0)
        )
        print(f"Using team_num filtering (team 3 = CT)")
    elif "side" in ticks_df.columns:
        # Older versions might use 'side'
        unique_sides = ticks_df["side"].unique().to_list()
        ct_side_val = "CT"
        
        # Handle different case conventions
        if "ct" in unique_sides:
            ct_side_val = "ct"  # Lowercase
        elif "CT" in unique_sides:
            ct_side_val = "CT"  # Uppercase
        elif "Counter-Terrorist" in unique_sides:
            ct_side_val = "Counter-Terrorist"
        elif 3 in unique_sides:
            ct_side_val = 3
            
        ct_ticks = ticks_df.filter(
            (pl.col("side") == ct_side_val) &
            (pl.col("health") > 0)
        )
        print(f"Using side filtering (side = {ct_side_val})")
        print(f"CT ticks found: {len(ct_ticks)}")
    else:
        print("ERROR: Cannot find side or team_num column!")
        return
    
    print(f"Processing {total_rounds} rounds...")
    
    # Data structures
    rounds_data = []
    position_stats = defaultdict(lambda: {
        'total_count': 0,
        'by_buy_type': defaultdict(int),
        'entry_points': defaultdict(int),
        'players': set()
    })
    
    # Process each round
    for round_num in range(1, total_rounds + 1):
        print(f"  Processing round {round_num}...")
        
        round_ticks = ct_ticks.filter(pl.col('round_num') == round_num)
        
        if len(round_ticks) == 0:
            continue
        
        # Find all CT players who spent time in B-Site this round
        b_site_players = set()
        for row in round_ticks.iter_rows(named=True):
            x, y = row['X'], row['Y']
            if is_in_b_site_area(x, y):
                b_site_players.add(row['name'])
        
        round_data = {
            'round_num': round_num,
            'ct_players': []
        }
        
        # Analyze each CT player who was in B-Site
        for player_name in b_site_players:
            # Get a representative tick for equipment (use first tick in B-Site)
            player_b_ticks = round_ticks.filter(pl.col('name') == player_name)
            first_tick = None
            
            for row in player_b_ticks.iter_rows(named=True):
                x, y = row['X'], row['Y']
                if is_in_b_site_area(x, y):
                    first_tick = row['tick']
                    break
            
            if first_tick is None:
                continue
            
            # Extract equipment
            equipment = extract_player_equipment(ticks_df, round_num, player_name, first_tick)
            if equipment is None:
                continue
            
            # Classify buy type
            buy_type = classify_buy_type(
                round_num, 
                total_rounds, 
                equipment['equipment_value'],
                equipment['primary_weapon']
            )
            
            # Analyze journey
            journey = analyze_player_journey(ct_ticks, round_num, player_name, sample_rate=32)
            
            if len(journey) == 0:
                continue
            
            # Determine primary position (where they spent most time)
            position_counts = defaultdict(int)
            for point in journey:
                position_counts[point['area']] += 1
            
            primary_position = max(position_counts.items(), key=lambda x: x[1])[0] if position_counts else "Unknown"
            
            # Calculate time spent in B-Site
            time_in_site = (journey[-1]['time'] - journey[0]['time']) if len(journey) > 1 else 0
            
            # Determine entry point
            entry_point = "unknown"
            if len(journey) > 0 and journey[0]['area'] in ["Window", "Doors", "Tunnel Exit"]:
                entry_point = journey[0]['area']
            
            # Extract grenade throws
            grenades = []
            if hasattr(dem, 'grenades'):
                grenades = extract_grenade_throws(dem.grenades, round_num, player_name)
            
            player_data = {
                'name': player_name,
                'buy_type': buy_type,
                'equipment': {
                    'primary_weapon': equipment['primary_weapon'],
                    'armor_value': equipment['armor_value'],
                    'has_helmet': equipment['has_helmet'],
                    'total_value': equipment['equipment_value'],
                    'health': equipment['health']
                },
                'journey': journey,
                'utility_throws': grenades,
                'entry_point': entry_point,
                'primary_position': primary_position,
                'time_in_site': round(time_in_site, 2)
            }
            
            round_data['ct_players'].append(player_data)
            
            # Update aggregate statistics
            position_stats[primary_position]['total_count'] += 1
            position_stats[primary_position]['by_buy_type'][buy_type] += 1
            position_stats[primary_position]['entry_points'][entry_point] += 1
            position_stats[primary_position]['players'].add(player_name)
        
        rounds_data.append(round_data)
    
    # Calculate aggregate statistics
    aggregate_stats = {
        'total_rounds': total_rounds,
        'position_stats': []
    }
    
    for area, stats in position_stats.items():
        total_count = stats['total_count']
        
        buy_type_breakdown = {}
        for buy_type, count in stats['by_buy_type'].items():
            buy_type_breakdown[buy_type] = {
                'count': count,
                'percentage': round(count / total_count, 3) if total_count > 0 else 0
            }
        
        entry_point_breakdown = {}
        for entry, count in stats['entry_points'].items():
            entry_point_breakdown[entry] = count
        
        aggregate_stats['position_stats'].append({
            'area': area,
            'overall_frequency': round(total_count / total_rounds, 3) if total_rounds > 0 else 0,
            'total_occurrences': total_count,
            'by_buy_type': buy_type_breakdown,
            'entry_points': entry_point_breakdown,
            'unique_players': len(stats['players'])
        })
    
    # Sort by frequency
    aggregate_stats['position_stats'].sort(key=lambda x: x['overall_frequency'], reverse=True)
    
    # Prepare final output
    output_data = {
        'metadata': {
            'demo_file': os.path.basename(DEMO_PATH),
            'total_rounds': total_rounds,
            'map': 'de_dust2'
        },
        'rounds': rounds_data,
        'aggregate': aggregate_stats
    }
    
    # Save to JSON
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n✅ Analysis complete!")
    print(f"📊 Processed {total_rounds} rounds")
    print(f"💾 Data saved to: {OUTPUT_PATH}")
    print(f"\nTop positions by frequency:")
    for stat in aggregate_stats['position_stats'][:5]:
        print(f"  {stat['area']}: {stat['overall_frequency']*100:.1f}% ({stat['total_occurrences']} occurrences)")

if __name__ == "__main__":
    main()
