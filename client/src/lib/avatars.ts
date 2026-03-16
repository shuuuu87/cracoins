import avatar1 from "@assets/WhatsApp_Image_2026-03-10_at_2.22.33_PM_(1)_1773132902868_1773566690065.jpeg";
import avatar2 from "@assets/WhatsApp_Image_2026-03-10_at_2.22.33_PM_1773132902870_1773566690069.jpeg";
import avatar3 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.49_PM_1773132902871_1773566677864.jpeg";
import avatar4 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_(2)_1773132902872_1773566665341.jpeg";
import avatar5 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_(1)_1773132902874_1773566665339.jpeg";
import avatar6 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.48_PM_1773132902875_1773566677851.jpeg";
import avatar7 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.47_PM_1773132902876_1773566653017.jpeg";
import avatar8 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.45_PM_(1)_1773132902877_1773566639719.jpeg";
import avatar9 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.45_PM_1773132902879_1773566653015.jpeg";
import avatar10 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.44_PM_(1)_1773132902880_1773566639713.jpeg";
import avatar11 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.44_PM_1773132902881_1773566639715.jpeg";
import avatar12 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_(2)_1773132902883_1773566639710.jpeg";
import avatar13 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_(1)_1773132902884_1773566639709.jpeg";
import avatar14 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.43_PM_1773132902885_1773566639712.jpeg";
import avatar15 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.42_PM_(1)_1773132902887_1773566639706.jpeg";
import avatar16 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.42_PM_1773132902888_1773566639708.jpeg";
import avatar17 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.41_PM_(1)_1773132902889_1773566627062.jpeg";
import avatar18 from "@assets/WhatsApp_Image_2026-03-10_at_2.20.41_PM_1773132902890_1773566616806.jpeg";
import avatar19 from "@assets/WhatsApp_Image_2026-03-11_at_1.11.43_PM_1773215125080_1773566699962.jpeg";
import avatar20 from "@assets/WhatsApp_Image_2026-03-11_at_1.11.44_PM_(1)_1773215141459_1773566699964.jpeg";

const DICEBEAR_BASE = "https://api.dicebear.com/7.x/bottts/svg";
const dicebearSeeds = [
  "titan-02", "titan-03", "titan-04", "titan-05", "titan-06",
  "titan-07", "titan-08", "titan-09", "titan-10", "titan-11",
  "titan-12", "titan-13", "titan-14", "titan-15", "titan-16",
  "titan-17", "titan-18", "titan-19", "titan-20",
];

const dicebearAvatars = dicebearSeeds.map((seed, i) => ({
  id: `avatar${i + 21}`,
  image: `${DICEBEAR_BASE}?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf&backgroundType=gradientLinear`,
}));

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
  { id: "avatar19", image: avatar19 },
  { id: "avatar20", image: avatar20 },
  ...dicebearAvatars,
];

export const getAvatarImage = (avatarId: string): string | undefined => {
  return AVATAR_LIST.find(a => a.id === avatarId)?.image;
};
