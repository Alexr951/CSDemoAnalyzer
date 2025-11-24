import os
import json
import pandas as pd
from awpy import Demo

# Define paths
DEMO_PATH = r"c:\Users\alexr\OneDrive\Documents\GitHub\CSDemoAnalyzer\Notebooks_Demos\demos\g2-vs-spirit-m3-dust2.dem"
OUTPUT_PATH = "b_site_data.json"

def classify_b_site_position(x, y):
    """Classifies the position within B-Site based on coordinates."""
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
    elif -2264 <= x <= -963 and -72 <= y <= 1738:
        return "B-Site Area"
    
    return "Not in B-Site"

def main():
    print(f"Loading demo from: {DEMO_PATH}")
    try:
        dem = Demo(DEMO_PATH)
        dem.parse()
    except Exception as e:
        print(f"Error loading demo: {e}")
        return

    print("Demo parsed successfully. Extracting data...")

    # Data structures for aggregation
    position_counts = {}
    utility_usage = {}
    
    # 1. Player Positions
    ticks_df = dem.ticks
    
    # Debug: Print columns and unique sides
    print(f"Ticks columns: {ticks_df.columns}")
    if "side" in ticks_df.columns:
        print(f"Unique sides in ticks: {ticks_df['side'].unique().to_list()}")
    
    # Filter: CT side and Alive
    # Try to handle different side naming conventions
    if "side" in ticks_df.columns:
        # Check if "CT" is in the unique values, otherwise might be "Counter-Terrorist" or int
        unique_sides = ticks_df["side"].unique().to_list()
        ct_side_val = "CT"
        if "CT" not in unique_sides and "Counter-Terrorist" in unique_sides:
            ct_side_val = "Counter-Terrorist"
        
        ct_alive_df = ticks_df.filter(
            (ticks_df["side"] == ct_side_val) & 
            (ticks_df["health"] > 0)
        )
    else:
        print("Error: 'side' column not found in ticks.")
        return
    
    # Sample every 64 ticks (approx 1 sec)
    all_ticks = sorted(ct_alive_df["tick"].unique())
    sample_ticks = [t for i, t in enumerate(all_ticks) if i % 64 == 0]
    
    sampled_df = ct_alive_df.filter(ct_alive_df["tick"].is_in(sample_ticks))
    
    print(f"Analyzing {len(sampled_df)} player-ticks...")
    
    total_b_site_ticks = 0
    
    for row in sampled_df.iter_rows(named=True):
        x, y = row["X"], row["Y"]
        area = classify_b_site_position(x, y)
        
        if area != "Not in B-Site":
            total_b_site_ticks += 1
            position_counts[area] = position_counts.get(area, 0) + 1

    # 2. Utility Usage
    if hasattr(dem, 'grenades'):
        grenades_df = dem.grenades
        print(f"Grenades columns: {grenades_df.columns}")
        
        # Determine the side column for grenades
        thrower_side_col = None
        if "thrower_side" in grenades_df.columns:
            thrower_side_col = "thrower_side"
        elif "side" in grenades_df.columns:
            thrower_side_col = "side"
        elif "thrower_team" in grenades_df.columns:
            thrower_side_col = "thrower_team"
            
        if thrower_side_col:
            # Check unique values to match CT
            unique_g_sides = grenades_df[thrower_side_col].unique().to_list()
            ct_g_side_val = "CT"
            if "CT" not in unique_g_sides and "Counter-Terrorist" in unique_g_sides:
                ct_g_side_val = "Counter-Terrorist"
                
            ct_grenades = grenades_df.filter(grenades_df[thrower_side_col] == ct_g_side_val)
            
            for row in ct_grenades.iter_rows(named=True):
                x, y = row["X"], row["Y"]
                grenade_type = row["grenade_type"]
                
                area = classify_b_site_position(x, y)
                
                if area != "Not in B-Site":
                    if area not in utility_usage:
                        utility_usage[area] = {}
                    
                    utility_usage[area][grenade_type] = utility_usage[area].get(grenade_type, 0) + 1
        else:
             print("Warning: Could not find side/team column in grenades dataframe.")
    else:
        print("Warning: 'grenades' attribute not found in demo object. Skipping utility analysis.")

    # Prepare output data
    output_data = {
        "total_b_site_samples": total_b_site_ticks,
        "positions": [],
        "utility": utility_usage
    }
    
    # Format positions
    for area, count in position_counts.items():
        percentage = (count / total_b_site_ticks) * 100 if total_b_site_ticks > 0 else 0
        output_data["positions"].append({
            "area": area,
            "count": count,
            "percentage": round(percentage, 2)
        })
    
    # Sort positions by frequency
    output_data["positions"].sort(key=lambda x: x["count"], reverse=True)
    
    # Save to JSON
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Analysis complete. Data saved to {OUTPUT_PATH}")
    print("Top positions:")
    for pos in output_data["positions"][:5]:
        print(f"  {pos['area']}: {pos['percentage']}%")

if __name__ == "__main__":
    main()
