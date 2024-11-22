declare module '*/data.json' {
  export interface DataStructure {
    stars: {
      colors: number[];
      names: string[];
      creation_update: string[];
      users: string[];
    }
  }
  const value: DataStructure;
  export default value;
} 