import { Box, Button, Flex, Icon } from "@chakra-ui/react";

import { useState } from "react";
import { CODE_EXAMPLES } from "../../constants/ExampleConstants";
import RefreshButton from "../../components/common/RefreshButton";
import { CodeTab, PreviewTab, TabbedLayout } from "../../components/common/TabbedLayout";
import CodeExample from '../../components/code/CodeExample';
import CountUp from "../../content/TextAnimations/CountUp/CountUp";
import GradientText from "../../content/TextAnimations/GradientText/GradientText";
import { TbFlame } from "react-icons/tb";
import { Link } from "react-router-dom";
import PropTable from "../../components/common/PropTable";

const CountUpDemo = () => {
  const { countup } = CODE_EXAMPLES;
  const [counter, setCounter] = useState(0);
  const [counter2, setCounter2] = useState(0);
  const [counter3, setCounter3] = useState(0);

  const [startCounting, setStartCounting] = useState(false);
  // const [startCounting2, setStartCounting2] = useState(false);

  const reRender = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  const reRender2 = () => {
    setCounter2((prevCounter) => prevCounter + 1);
  };

  const reRender3 = () => {
    setCounter3((prevCounter) => prevCounter + 1);
  };


  const propData = [
    {
      name: 'to',
      type: 'number',
      default: '—',
      description: 'The target number to count up to.',
    },
    {
      name: 'from',
      type: 'number',
      default: '0',
      description: 'The initial number from which the count starts.',
    },
    {
      name: 'direction',
      type: 'string',
      default: '"up"',
      description: 'Direction of the count; can be "up" or "down". When this is set to "down", "from" and "to" become reversed, in order to count down.',
    },
    {
      name: 'delay',
      type: 'number',
      default: '0',
      description: 'Delay in seconds before the counting starts.',
    },
    {
      name: 'duration',
      type: 'number',
      default: '2',
      description: 'Duration of the count animation - based on the damping and stiffness configured inside the component.',
    },
    {
      name: 'className',
      type: 'string',
      default: '""',
      description: 'CSS class to apply to the component for additional styling.',
    },
    {
      name: 'startWhen',
      type: 'boolean',
      default: 'true',
      description: 'A boolean to control whether the animation should start when the component is in view. It basically works like an if statement, if this is true, the count will start.',
    },
    {
      name: 'separator',
      type: 'string',
      default: '""',
      description: 'Character to use as a thousands separator in the displayed number.',
    },
    {
      name: 'onStart',
      type: 'function',
      default: '—',
      description: 'Callback function that is called when the count animation starts.',
    },
    {
      name: 'onEnd',
      type: 'function',
      default: '—',
      description: 'Callback function that is called when the count animation ends.',
    }
  ];

  return (
    <TabbedLayout>
      <PreviewTab>
        <h2 className="demo-title-extra">Default</h2>
        <Box position="relative" className="demo-container" minH={200}>
          {/* <Button onClick={() => setStartCounting(true)}>Start Counting</Button> */}

          <CountUp
            key={counter}
            from={0}
            to={100}
            separator=","
            direction="up"
            duration={1}
            className="count-up-text"
          />

          <RefreshButton onClick={reRender} />
        </Box>

        <h2 className="demo-title-extra">Start programatically</h2>
        <Flex direction="column" justifyContent="center" alignItems="center" position="relative" className="demo-container" minH={200}>
          <Button onClick={() => setStartCounting(true)}>Count to 500!</Button>

          <CountUp
            key={counter2}
            from={100}
            to={500}
            startWhen={startCounting}
            duration={5}
            className="count-up-text"
          />

          {startCounting && <RefreshButton onClick={reRender2} />}
        </Flex>

        <h2 className="demo-title-extra"><Icon as={TbFlame} position="relative" top={'4px'} />Hot tip</h2>
        <p className="demo-extra-info">
          <Flex>
            <span>
              You can wrap the counter with other components such as&nbsp;
              <Link style={{ display: 'inline', whiteSpace: 'nowrap' }} to='/text-animations/gradient-text/'>&lt;GradientText /&gt;</Link>
            </span>
          </Flex>

        </p>
        <Flex direction="column" justifyContent="center" alignItems="center" position="relative" className="demo-container" minH={200}>
          {/* <Button onClick={() => setStartCounting2(true)}>Start</Button> */}

          <GradientText>
            <CountUp
              key={counter3}
              // startWhen={startCounting2}
              from={0}
              to={100}
              separator=","
              duration={1}
              className="count-up-text"
            />
          </GradientText>

          <RefreshButton onClick={reRender3} />
        </Flex>

        <h2 className="demo-title-extra">Dependencies</h2>
        <div className="demo-details">
          <span>framer-motion</span>
        </div>

        <h2 className="demo-title-extra">Component API</h2>
        <PropTable data={propData} />
      </PreviewTab>

      <CodeTab>
        <CodeExample codeObject={countup} />
      </CodeTab>
    </TabbedLayout>
  );
};

export default CountUpDemo;
