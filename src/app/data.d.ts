export interface StarDetails {
  seed: string | null;
  time_played: string | null;
  comment: string | null;
  factorio_version: string | null;
  mods: string[];
  player_count: string | null;
  uploaded: string | null;
}

export interface DataStructure {
  stars: {
    colors: number[];
    names: string[];
    creation_update: string[];
    users: string[];
    details: (StarDetails | null)[];
  }
}

declare const value: DataStructure;
export default value; 