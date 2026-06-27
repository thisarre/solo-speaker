import { Composition } from "remotion";
import { ClarityWorkflow } from "./videos/clarity-workflow";
import { ProductFlow } from "./videos/product-flow";

export function RemotionRoot() {
  return (
    <>
      <Composition component={ClarityWorkflow} defaultProps={{ lang: "fr" }} durationInFrames={240} fps={30} height={1080} id="ClarityWorkflow-fr" width={1920} />
      <Composition component={ClarityWorkflow} defaultProps={{ lang: "en" }} durationInFrames={240} fps={30} height={1080} id="ClarityWorkflow-en" width={1920} />
      <Composition component={ProductFlow} defaultProps={{ lang: "fr" }} durationInFrames={240} fps={30} height={1080} id="ProductFlow-fr" width={1920} />
      <Composition component={ProductFlow} defaultProps={{ lang: "en" }} durationInFrames={240} fps={30} height={1080} id="ProductFlow-en" width={1920} />
    </>
  );
}
