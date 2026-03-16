import { Composition } from "remotion";
import { GoogleDocsDemo } from "./GoogleDocsDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GoogleDocsDemo"
      component={GoogleDocsDemo}
      durationInFrames={60 * 30} // 60 seconds at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
