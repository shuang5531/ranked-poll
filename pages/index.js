import React, {
  useState, useEffect, useMemo, useRef,
} from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { gql, useMutation, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import PollOption from '../components/pollOption';
import { themeColorVar } from '../components/layout';

import { Card, Description, SubmitButton } from '../style/card';
import Colors from '../style/colors';

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.div`
  margin: 20px;
  width: 50%;
  font-family: Merriweather, serif;
  font-size: 2.4em;
  text-align: center;
  color: white;
  text-shadow: 0 0 8px black;
`;

const Why = styled.a`
  margin: 0 0.5ch;
  font-size: 0.8em;
  background-color: rgb(${() => useReactiveVar(themeColorVar).join(',')});
  filter: saturate(300%);
  padding: 4px;
  border-radius: 4px;
  text-shadow: 0 0 2px black;
  box-shadow: 0 0 2px 1px rgba(0,0,0,0.5);
  cursor: pointer;
  color: white;
  text-decoration: none;

  :hover {
    text-decoration: underline;
    box-shadow: 0 0 2px 2px rgba(0,0,0,0.5);
  }

  :active {
    filter: saturate(300%) brightness(80%);
  }
`;

const Question = styled.input`
  font-family: Merriweather, serif;
  border: 0;
  border-bottom: 1px solid black;
  margin-bottom: 8px;
  width: 100%;
  padding: 4px;

  :focus {
    outline: none;
  }
`;

const DescriptionBox = styled(Description)`
  padding-bottom: 1.4em;
  color: transparent;
`;

const DescriptionTextarea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 4px;
  border: 0;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  resize: none;
`;

const Options = styled.div`
  margin: 24px 0;
`;

const HintText = styled.span`
  font-size: 0.9em;
`;

const Option = styled.div`
  font-family: Open Sans, sans-serif;
`;

const ColorSelect = styled.select`
  margin: 0 1ch;
`;

const CustomColor = styled.span`
  margin: 0 1ch;
`;

const ColorInput = styled.input`
  margin-left: 0.2ch;
  width: 6ch;
`;

const CREATE_POLL = gql`
  mutation createPoll($input: CreatePollInput!) {
    createPoll(input: $input) {
      id
    }
  }
`;

const createCheckFunc = (value, set) => () => {
  set(!value);
};

const Index = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [randomize, setRandomize] = useState(true);
  const [colorName, setColorName] = useState('Sky Blue');
  const [customColor, setCustomColor] = useState(false);
  const [createPoll, { data }] = useMutation(CREATE_POLL);
  const [options, setOptions] = useState({
    [new Date().valueOf()]: '',
    [new Date().valueOf() + 1]: '',
  });
  const firstRender = useRef(true);

  const themeColor = useReactiveVar(themeColorVar);

  const changeColor = (e) => {
    setColorName(e.target.value);
  };

  const setColor = (index) => (e) => {
    const newThemeColor = [
      ...themeColor,
    ];
    newThemeColor[index] = parseInt(e.target.value, 10) || 0;
    themeColorVar(newThemeColor);
  };

  useEffect(() => {
    if (firstRender.current && !(
      themeColor[0] === 255
      && themeColor[1] === 255
      && themeColor[2] === 255
    )) {
      const colorResult = Object.keys(Colors).find(
        (name) => Colors[name][0] === themeColor[0]
        && Colors[name][1] === themeColor[1]
        && Colors[name][2] === themeColor[2],
      );
      if (colorResult) {
        setColorName(colorResult);
      } else {
        setCustomColor(true);
      }
      firstRender.current = false;
    } else if (!customColor) {
      themeColorVar(Colors[colorName]);
    }
  }, [colorName, customColor]);

  const router = useRouter();

  useEffect(() => {
    const id = data?.createPoll?.id;
    if (id) {
      router.push(`/poll/${id}`);
    }
  }, [data]);

  const optionsElement = useMemo(
    () => Object.entries(options).sort(([timeId1], [timeId2]) => timeId1 - timeId2).map(
      ([id, pollOption]) => {
        let lastOne = false;
        const ids = Object.keys(options).sort((timeId1, timeId2) => timeId1 - timeId2);
        if (id === ids[ids.length - 1]) {
          lastOne = true;
        }
        const onChange = (e) => {
          const newOptions = {
            ...options,
            [id]: e.target.value,
          };
          if (lastOne) {
            newOptions[new Date().valueOf()] = '';
          }
          setOptions(newOptions);
        };
        const onCancel = () => {
          const newoptions = { ...options };
          delete newoptions[id];
          setOptions(newoptions);
        };
        return (
          <PollOption
            key={id}
            value={pollOption.value}
            onChange={onChange}
            onCancel={onCancel}
            lastOne={lastOne}
            disabled
          />
        );
      },
    ),
    [options],
  );

  return (
    <Main>
      <Title>
        Instantly create ranked choice polls!
        <Link href="/about/" passHref><Why>Why?</Why></Link>
      </Title>
      <Card>
        <div>
          <Question type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your question" />
        </div>
        <div>
          <DescriptionBox>
            {description || 'Enter any clarifying details. Feel free to leave blank'}
            <DescriptionTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter any clarifying details. Feel free to leave blank" />
          </DescriptionBox>
        </div>
        <div>
          {optionsElement}
        </div>
        <Options>
          <Option>
            <label htmlFor="randomize">
              <input type="checkbox" id="randomize" checked={randomize} onChange={createCheckFunc(randomize, setRandomize)} />
              {' '}
              Randomize option order
              {' '}
              <HintText>Prevents position bias</HintText>
            </label>
          </Option>
          <Option>
            Color:
            {customColor ? (
              <CustomColor>
                <label htmlFor="colorR">
                  R
                  <ColorInput id="colorR" type="number" max="255" value={themeColor[0]} onChange={setColor(0)} />
                </label>
                {' '}
                <label htmlFor="colorG">
                  G
                  <ColorInput id="colorG" type="number" max="255" value={themeColor[1]} onChange={setColor(1)} />
                </label>
                {' '}
                <label htmlFor="colorB">
                  B
                  <ColorInput id="colorB" type="number" max="255" value={themeColor[2]} onChange={setColor(2)} />
                </label>
              </CustomColor>
            )
              : (
                <ColorSelect onChange={changeColor} value={colorName}>
                  {Object.keys(Colors).map((name) => <option key={name}>{name}</option>)}
                </ColorSelect>
              )}
            <label htmlFor="customColor">
              <input id="customColor" type="checkbox" checked={customColor} onChange={createCheckFunc(customColor, setCustomColor)} />
              {' '}
              Custom
            </label>
          </Option>
        </Options>
        <SubmitButton
          color={themeColor.join(',')}
          type="button"
          onClick={() => createPoll({
            variables: {
              input: {
                title,
                description,
                owner: null,
                options: [...new Set(Object.values(options).filter((value) => value.replace(/\s/g, '')))],
                color: themeColor,
                randomize,
              },
            },
          })}
          disabled={!title || Object.values(options).join('') === ''}
        >
          Submit
        </SubmitButton>
      </Card>
    </Main>
  );
};

export default Index;

// const ViewerQuery = gql`
//   query ViewerQuery {
//     viewer {
//       id
//       email
//     }
//   }
// `

// const Index = () => {
//   const router = useRouter()
//   const { data, loading, error } = useQuery(ViewerQuery)
//   const viewer = data?.viewer
//   const shouldRedirect = !(loading || error || viewer)

//   useEffect(() => {
//     if (shouldRedirect) {
//       router.push('/signin')
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [shouldRedirect])

//   if (error) {
//     return <p>{error.message}</p>
//   }

//   if (viewer) {
//     return (
//       <div>
//         You're signed in as {viewer.email} goto{' '}
//         <Link href="/about">
//           <a>about</a>
//         </Link>{' '}
//         page. or{' '}
//         <Link href="/signout">
//           <a>signout</a>
//         </Link>
//       </div>
//     )
//   }

//   return <p>Loading...</p>
// }
