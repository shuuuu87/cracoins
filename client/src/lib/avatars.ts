import avatar1 from "@assets/WhatsApp_Image_2026-03-10_at_2.22.33_PM_(1)_1773132902868.jpeg";
import avatar2 from "@assets/WhatsApp_Image_2026-03-10_at_2.22.33_PM_1773132902870.jpeg";
import avatar3 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.49_PM_1773132902871.jpeg";
import avatar4 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_(2)_1773132902872.jpeg";
import avatar5 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_(1)_1773132902874.jpeg";
import avatar6 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_1773132902875.jpeg";
import avatar7 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.47_PM_1773132902876.jpeg";
import avatar8 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.45_PM_(1)_1773132902877.jpeg";
import avatar9 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.45_PM_1773132902879.jpeg";
import avatar10 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.44_PM_(1)_1773132902880.jpeg";
import avatar11 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.44_PM_1773132902881.jpeg";
import avatar12 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_(2)_1773132902883.jpeg";
import avatar13 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_(1)_1773132902884.jpeg";
import avatar14 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_1773132902885.jpeg";
import avatar15 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.42_PM_(1)_1773132902887.jpeg";
import avatar16 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.42_PM_1773132902888.jpeg";
import avatar17 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.41_PM_(1)_1773132902889.jpeg";
import avatar18 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.41_PM_1773132902890.jpeg";

export const AVATAR_LIST = [
  { id: "avatar1", image: avatar1 },
  { id: "avatar2", image: avatar2 },
  { id: "avatar3", image: avatar3 },
  { id: "avatar4", image: avatar4 },
  { id: "avatar5", image: avatar5 },
  { id: "avatar6", image: avatar6 },
  { id: "avatar7", image: avatar7 },
  { id: "avatar8", image: avatar8 },
  { id: "avatar9", image: avatar9 },
  { id: "avatar10", image: avatar10 },
  { id: "avatar11", image: avatar11 },
  { id: "avatar12", image: avatar12 },
  { id: "avatar13", image: avatar13 },
  { id: "avatar14", image: avatar14 },
  { id: "avatar15", image: avatar15 },
  { id: "avatar16", image: avatar16 },
  { id: "avatar17", image: avatar17 },
  { id: "avatar18", image: avatar18 },
];

export const getAvatarImage = (avatarId: string): string | undefined => {
  return AVATAR_LIST.find(a => a.id === avatarId)?.image;
};
