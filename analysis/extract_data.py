"""
CS2 Demo Analysis - Enhanced Data Extraction
Extracts comprehensive round-by-round data including:
- All CT players in B-Site (not just one anchor)
- Player journeys with timestamps
- Equipment tracking and buy type classification using actual money and round start equipment
- Utility usage with throw locations
- Aggregate statistics with conditional filtering
- Money tracking from demo data
"""

import os
import json
from collections import defaultdict
from awpy import Demo
import polars as pl

# Configuration
DEMO_PATH = r"c:\Users\alexr\OneDrive\Documents\GitHub\CSDemoAnalyzer\Notebooks_Demos\demos\g2-vs-spirit-m3-dust2.dem"
OUTPUT_PATH = r"c:\Users\alexr\OneDrive\Documents\GitHub\CSDemoAnalyzer\web_app\public\data.json"

# B-Site area boundaries (verified for de_dust2)
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

# Actual CS2 weapon prices
WEAPON_PRICES = {
    'ak47': 2700, 'm4a1': 2900, 'm4a1_silencer': 2900, 'famas': 2050, 'aug': 3300, 'sg556': 3000, 'galilar': 1800,
    'awp': 4750, 'ssg08': 1700, 'scar20': 5000, 'g3sg1': 5000,
    'mac10': 1050, 'mp9': 1250, 'mp7': 1500, 'ump45': 1200, 'p90': 2350, 'bizon': 1400,
    'p250': 300, 'fiveseven': 500, 'tec9': 500, 'cz75a': 500, 'deagle': 700, 'revolver': 600,
    'usp_silencer': 200, 'hkp2000': 200, 'glock': 200, 'elite': 300
}

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

def get_weapon_price(weapon_name):
    """Get actual CS2 weapon price"""
    if not weapon_name or weapon_name == 'None':
        return 0
    weapon_name = weapon_name.lower().replace('weapon_', '')
    return WEAPON_PRICES.get(weapon_name, 0)

def calculate_equipment_value(primary_weapon, armor_value, has_helmet, grenades=None):
    """Calculate accurate equipment value using real CS2 prices"""
    value = 0
    
    # Primary weapon - only if it's a valid weapon name (not an entity ID)
    if primary_weapon and primary_weapon != 'None':
        # Check if it's a numeric ID (entity ID) - if so, we can't price it directly
        try:
            weapon_id = float(str(primary_weapon))
            # If it's a large number, it's an entity ID - estimate based on armor/context
            if weapon_id > 1000000:
                # Entity ID - we'll estimate based on other factors
                # If they have full armor + helmet, likely a full buy
                if armor_value > 0 and has_helmet:
                    value += 3000  # Estimate for rifle
                elif armor_value > 0:
                    value += 1500  # Estimate for SMG or partial buy
            else:
                # Small number might be a weapon enum, try to get price
                value += get_weapon_price(primary_weapon)
        except:
            # Not a number, treat as weapon name
            value += get_weapon_price(primary_weapon)
    
    # Armor
    if armor_value > 0:
        value += 650 if has_helmet else 500
    
    # Grenades (approximate)
    if grenades:
        grenade_prices = {'hegrenade': 300, 'flashbang': 200, 'smokegrenade': 300, 'incgrenade': 600, 'molotov': 400}
        for nade in grenades:
            nade_name = nade.lower().replace('weapon_', '')
            value += grenade_prices.get(nade_name, 200)
    
    return value

def classify_buy_type(round_num, total_rounds, equipment_value, primary_weapon, money_at_start=None, armor_value=0, has_helmet=False):
    """
    Classify round buy type based on round number, equipment, and money
    - Pistol: First round of each half (round 1 and round 16 for MR12, or round 1 and round 13 for MR15)
    - Eco: Equipment value < 2000 or pistol only, and money < 3000
    - Light Buy: SMG with value < 3500, money between 3000-5000
    - Full Buy: Value >= 3500 or rifle/AWP, money >= 5000
    """
    # Determine half break (round 16 for MR12, round 13 for MR15)
    half_break = 16 if total_rounds <= 24 else 13
    
    # Pistol rounds (first round of each half)
    if round_num == 1 or round_num == half_break:
        return 'pistol'
    
    weapon_type = get_weapon_type(primary_weapon)
    
    # If weapon is an entity ID (numeric), use armor and equipment value to classify
    is_entity_id = False
    if primary_weapon and primary_weapon != 'None':
        try:
            weapon_id = float(str(primary_weapon))
            if weapon_id > 1000000:
                is_entity_id = True
        except:
            pass
    
    # Use money if available for better classification
    if money_at_start is not None:
        # Full buy: high equipment value and enough money
        if equipment_value >= BUY_THRESHOLDS['full_buy'] and money_at_start >= 5000:
            return 'full_buy'
        # Full buy: has rifle/heavy and enough money
        if weapon_type in ['rifle', 'heavy'] and money_at_start >= 5000:
            return 'full_buy'
        # Full buy: full armor + helmet + high money suggests full buy
        if armor_value > 0 and has_helmet and equipment_value >= 2000 and money_at_start >= 4000:
            return 'full_buy'
        # Light buy: SMG with moderate money
        if weapon_type == 'smg' and 3000 <= money_at_start < 5000:
            return 'light_buy'
        # Light buy: partial armor or moderate equipment
        if 2000 <= equipment_value < BUY_THRESHOLDS['full_buy'] and 2000 <= money_at_start < 5000:
            return 'light_buy'
        # Eco: low money or pistol only
        if money_at_start < 3000 or weapon_type == 'pistol' or equipment_value < BUY_THRESHOLDS['eco']:
            return 'eco'
        # Default based on equipment
        if equipment_value >= BUY_THRESHOLDS['full_buy']:
            return 'full_buy'
        return 'light_buy'
    else:
        # Fallback to equipment-based classification
        # Full armor + helmet usually indicates full buy
        if armor_value > 0 and has_helmet and equipment_value >= 2000:
            if equipment_value >= BUY_THRESHOLDS['full_buy']:
                return 'full_buy'
            else:
                return 'light_buy'
        
        # Classification based on equipment value
        if equipment_value < BUY_THRESHOLDS['eco'] or weapon_type == 'pistol':
            return 'eco'
        if weapon_type == 'smg' and equipment_value < BUY_THRESHOLDS['light_buy']:
            return 'light_buy'
        if equipment_value >= BUY_THRESHOLDS['full_buy'] or weapon_type in ['rifle', 'heavy']:
            return 'full_buy'
        # If we have armor but low equipment value, might be light buy
        if armor_value > 0 and 1000 <= equipment_value < BUY_THRESHOLDS['full_buy']:
            return 'light_buy'
        return 'eco'

def extract_player_equipment_at_round_start(ticks_df, round_num, player_name, rounds_df=None, buys_df=None, economy_df=None):
    """Extract equipment information for a player at round start (first few seconds)"""
    # Try to get round start tick from rounds dataframe if available
    round_start_tick = None
    if rounds_df is not None and len(rounds_df) > 0:
        round_data = rounds_df.filter(pl.col('round_num') == round_num)
        if len(round_data) > 0:
            round_row = round_data.row(0, named=True)
            # Try different column names for round start tick
            round_start_tick = round_row.get('freeze_end', round_row.get('start', round_row.get('start_tick', None)))
    
    # Try to get weapon and money from buys dataframe first (most accurate)
    weapon_from_buys = None
    money_from_buys = None
    if buys_df is not None and len(buys_df) > 0:
        player_buys = buys_df.filter(
            (pl.col('round_num') == round_num) &
            (pl.col('player_name') == player_name)
        )
        if len(player_buys) > 0:
            # Get all buys for this player in this round
            for buy_row in player_buys.iter_rows(named=True):
                # Get weapon from buy - try multiple column names
                weapon = None
                for col in ['weapon', 'item', 'weapon_name', 'item_name', 'equipment']:
                    if col in buy_row:
                        val = buy_row[col]
                        if val and val != 'None' and str(val).lower() != 'none':
                            weapon = str(val)
                            break
                
                if weapon:
                    # Prefer primary weapons over pistols/utilities
                    weapon_type = get_weapon_type(weapon)
                    if weapon_type in ['rifle', 'heavy', 'smg']:
                        weapon_from_buys = weapon
                        break
                    elif weapon_from_buys is None:  # Fallback to any weapon
                        weapon_from_buys = weapon
                
                # Get money before buy (if available)
                if money_from_buys is None:
                    for money_col in ['money_before', 'cash', 'money', 'total_money', 'cash_before']:
                        if money_col in buy_row:
                            money_from_buys = buy_row[money_col]
                            if money_from_buys is not None:
                                break
    
    # Try economy dataframe
    money_from_economy = None
    if economy_df is not None and len(economy_df) > 0:
        player_economy = economy_df.filter(
            (pl.col('round_num') == round_num) &
            (pl.col('player_name') == player_name)
        )
        if len(player_economy) > 0:
            econ_row = player_economy.row(0, named=True)
            money_from_economy = econ_row.get('cash', econ_row.get('money', econ_row.get('total_money', None)))
    
    # Get round ticks for this player
    round_ticks = ticks_df.filter(
        (pl.col('round_num') == round_num) &
        (pl.col('name') == player_name)
    ).sort('tick')
    
    if len(round_ticks) == 0:
        return None
    
    # If we have round start tick, use ticks after that (within first 5 seconds)
    if round_start_tick:
        # Get ticks within first 5 seconds of round start (~320 ticks at 64 tickrate)
        start_window = round_ticks.filter(
            (pl.col('tick') >= round_start_tick) &
            (pl.col('tick') <= round_start_tick + 320)
        )
        if len(start_window) > 0:
            round_ticks = start_window
    
    # Get first tick where player is alive (round start)
    first_alive_tick = round_ticks.filter(pl.col('health') > 0)
    if len(first_alive_tick) == 0:
        # If no alive ticks, use first tick anyway
        first_alive_tick = round_ticks.head(1)
    
    if len(first_alive_tick) == 0:
        return None
    
    row = first_alive_tick.row(0, named=True)
    
    # Get weapons - prefer buys dataframe, then try ticks
    primary = weapon_from_buys  # Use weapon from buys if available
    
    if not primary or primary == 'None':
        # Try to get from ticks dataframe
        # Note: active_weapon might be an entity ID (numeric), not a name
        weapon_cols = ['active_weapon', 'weapon', 'weapon_name', 'weapon_primary', 'primary_weapon', 'current_weapon']
        for col in weapon_cols:
            if col in row:
                val = row[col]
                if val and val != 'None':
                    val_str = str(val)
                    # Check if it's a numeric ID (entity ID) - these are usually large numbers
                    # Weapon names are strings, IDs are numbers
                    try:
                        val_float = float(val_str)
                        # If it's a very large number, it's likely an entity ID, skip it
                        if val_float > 1000000:
                            continue
                    except:
                        pass
                    
                    if val_str.lower() != 'none':
                        primary = val_str
                        break
        
        # If still no weapon, check if there's inventory data
        if not primary or primary == 'None':
            # Check for inventory columns
            for col in row.keys():
                if 'weapon' in col.lower():
                    val = row[col]
                    if val and str(val).lower() != 'none':
                        try:
                            # Skip if it's a large numeric ID
                            val_float = float(str(val))
                            if val_float > 1000000:
                                continue
                        except:
                            pass
                        primary = str(val)
                        break
    
    if not primary:
        primary = 'None'
    
    # Get armor - try multiple column names
    # awpy uses 'armor' column which contains armor value (0-100)
    armor_value = row.get('armor', row.get('armor_value', 0))
    if armor_value is None:
        armor_value = 0
    armor_value = int(armor_value) if armor_value else 0
    
    # Get helmet status - in CS2, armor > 100 means helmet, or check has_helmet column
    has_helmet = False
    if 'has_helmet' in row:
        has_helmet = bool(row['has_helmet'])
    elif 'helmet' in row:
        has_helmet = bool(row['helmet'])
    # In CS2, armor value > 100 typically indicates helmet (100 = kevlar, >100 = kevlar+helmet)
    elif armor_value > 100:
        has_helmet = True
        armor_value = 100  # Normalize to 100 for kevlar+helmet
    elif armor_value == 100:
        # Could be either, but if it's exactly 100, assume no helmet for safety
        has_helmet = False
    
    # Get money if available - try multiple sources
    money = money_from_buys or money_from_economy  # From buys/economy dataframe first
    if money is None:
        # Try from ticks
        money = row.get('cash', row.get('money', row.get('total_money', None)))
    
    # Calculate accurate equipment value
    equipment_value = calculate_equipment_value(primary, armor_value, has_helmet)
    
    return {
        'primary_weapon': primary if primary else 'None',
        'armor_value': armor_value,
        'has_helmet': bool(has_helmet),
        'equipment_value': equipment_value,
        'health': row.get('health', 100),
        'money': money
    }

def analyze_player_journey(ticks_df, round_num, player_name, sample_rate=32):
    """
    Analyze a player's journey through B-Site for a specific round
    Returns journey points with timestamps and areas
    Uses proper awpy coordinate system (X, Y, Z)
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
        
        # Get coordinates - awpy uses X, Y, Z
        x = row.get('X', row.get('x', 0))
        y = row.get('Y', row.get('y', 0))
        z = row.get('Z', row.get('z', 0))
        
        # Validate coordinates are reasonable (not 0,0,0 or NaN)
        if x == 0 and y == 0 and z == 0:
            continue
        
        # Check if in B-Site area
        if is_in_b_site_area(x, y):
            if not in_b_site:
                first_b_site_tick = tick
                in_b_site = True
            
            area = classify_b_site_position(x, y)
            
            # Calculate time from round start (need round start tick)
            # For now, use absolute time
            journey.append({
                'tick': int(tick),
                'time': round(tick / 64.0, 2),  # Convert to seconds (assuming 64 tick)
                'x': round(float(x), 1),
                'y': round(float(y), 1),
                'z': round(float(z), 1),
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
        # Parse with player props including weapons and money
        # awpy requires explicit player_props to track equipment and money
        dem.parse(player_props=["health", "armor_value", "pitch", "yaw", "cash", "money", "total_money", "active_weapon", "weapon"])
    except Exception as e:
        print(f"Error loading demo: {e}")
        return
    
    print("Demo parsed successfully!")
    
    ticks_df = dem.ticks
    total_rounds = ticks_df['round_num'].max()
    print(f"Total rounds in demo: {total_rounds}")
    
    # Debug: Print columns to understand available data
    print(f"Available columns in ticks: {ticks_df.columns}")
    
    # Check for money/cash columns in ticks
    money_columns = [col for col in ticks_df.columns if 'money' in col.lower() or 'cash' in col.lower()]
    if money_columns:
        print(f"Money columns found in ticks: {money_columns}")
    else:
        print("Warning: No money columns found in ticks")
    
    # Check rounds dataframe for economy data
    rounds_df = None
    if hasattr(dem, 'rounds') and dem.rounds is not None:
        rounds_df = dem.rounds
        print(f"Rounds dataframe columns: {rounds_df.columns}")
    
    # Check buys dataframe for economy data (this is where money is often stored)
    buys_df = None
    if hasattr(dem, 'buys') and dem.buys is not None:
        buys_df = dem.buys
        print(f"Buys dataframe columns: {buys_df.columns}")
        if len(buys_df) > 0:
            print(f"Buys dataframe has {len(buys_df)} rows")
    else:
        print("No buys dataframe found")
    
    # Check if there's an economy dataframe
    economy_df = None
    if hasattr(dem, 'economy') and dem.economy is not None:
        economy_df = dem.economy
        print(f"Economy dataframe columns: {economy_df.columns}")
        if len(economy_df) > 0:
            print(f"Economy dataframe has {len(economy_df)} rows")
    else:
        print("No economy dataframe found")
    
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
            # Extract equipment at round start (not when entering B-site)
            equipment = extract_player_equipment_at_round_start(ticks_df, round_num, player_name, rounds_df, buys_df, economy_df)
            if equipment is None:
                continue
            
            # Get money at round start for better buy classification
            money_at_start = equipment.get('money')
            
            # Classify buy type using equipment and money
            buy_type = classify_buy_type(
                round_num, 
                total_rounds, 
                equipment['equipment_value'],
                equipment['primary_weapon'],
                money_at_start,
                equipment['armor_value'],
                equipment['has_helmet']
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
                    'health': equipment['health'],
                    'money': money_at_start  # Include money if available
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
