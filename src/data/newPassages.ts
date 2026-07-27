import { ReadingPassage } from "@/types/ielts";

// Parsed passages from Test 4, Test 5, and Test 7 HTML files
// These are authentic Cambridge IELTS Academic Reading passages

export const newPassages: ReadingPassage[] = [
  // TEST 4 - PASSAGE 1
  {
    slug: "the-wonder-plant",
    title: "The Wonder Plant",
    subtitle: "Bamboo is used for a wide range of purposes, but now it seems it may be under threat.",
    paragraphs: [
      {
        label: "A",
        text: "Every year, during the rainy season, the mountain gorillas of central Africa migrate to the lower slopes of the Virunga Mountains to graze on bamboo. For the 650 or so that remain in the wild, it's a vital food source. Without it, says Ian Redmond, chairman of the Ape Alliance, their chances of survival would be reduced significantly."
      },
      {
        label: "",
        text: "Gorillas aren't the only local keen on bamboo. For the people who live close to the Virungas, it's a valuable and versatile raw material. But in the past 100 years or so, resources have come under increasing pressure as populations have exploded and large areas of bamboo forest have been cleared to make way for commercial plantations. Sadly, this isn't an isolated story. All over the world, the ranges of many bamboo species appear to be shrinking, endangering the people and animals that depend upon them."
      },
      {
        label: "B",
        text: "Despite bamboo's importance, we know surprisingly little about it. A recent report published by the UN Environment Programme (UNEP) and the International Network for Bamboo and Rattan (INBAR) has revealed just how profound our ignorance of global bamboo resources is, particularly in relation to conservation."
      },
      {
        label: "",
        text: "There are almost 1,600 recognised species of bamboo, but the report concentrated on the 1,200 or so woody varieties distinguished by the strong stems, or 'culms', that most people associate with this versatile plant. Of these, only 38 'priority species' identified for their commercial value have been the subject of any real scientific research to date."
      },
      {
        label: "",
        text: "This problem isn't confined to bamboo. Compared to the work carried out on animals, the science of assessing the conservation status of plants is still in its infancy. 'People have only started looking at this during the past 10-15 years, and only now are they understanding how to go about it systematically,' says Dr Valerie Kapos, one of the report's authors."
      },
      {
        label: "C",
        text: "Bamboo tends to grow in 'stands' (or groups) made up of individual plants that grow from roots known as rhizomes. It is the world's fastest-growing woody plant and some species grow over a meter in one day. But the plant's ecological role extends beyond providing food for wildlife. Its rhizome systems, which lie in the top layers of the soil, are crucial in preventing soil erosion. And there is growing evidence that bamboo plays an important part in determining forest structure and dynamics. 'Bamboo's pattern of mass flowering and mass death leaves behind large areas of dry biomass that attract wildfire,' says Kapos. 'When these burn, they create patches of open ground far bigger than would be left by a fallen tree. Patchiness helps to preserve diversity because certain plant species do better during the early stages of regeneration when there are gaps in the canopy.'"
      },
      {
        label: "D",
        text: "However, bamboo's most immediate significance lies in its economic value. Many countries, particularly in Asia, are involved in the trade of bamboo products. Modern processing techniques mean it can be used in a variety of ways, for example as flooring and laminates. Traditionally it is used in construction, but one of the fastest growing bamboo products is paper – 25 per cent of paper produced in India is made from bamboo fibre."
      },
      {
        label: "",
        text: "Of course, bamboo's main function has always been in domestic applications, and as a locally traded product it is worth about US$4.5 billion annually. Bamboo is often the only readily available raw material for people in many developing countries, says Chris Stapleton, a research associate at the UK's Royal Botanic Gardens. 'Bamboo can be harvested from forest areas or grown quickly elsewhere, and then converted simply without expensive machinery or facilities,' he says. 'In this way, it contributes substantially to poverty alleviation.'"
      },
      {
        label: "E",
        text: "Keen horticulturists will spot an apparent contradiction in the worrying picture painted by the UNEP-INBAR report. Those in the West who've followed the recent vogue for cultivating exotic species in their gardens will point out that, if it isn't kept in check, bamboo can cause real problems. 'In a lot of places, the people who live with bamboo don't perceive it as being under threat in any way,' says Kapos. 'In fact, a lot of bamboo species are very invasive if they've been introduced.' So why are so many species endangered?"
      },
      {
        label: "",
        text: "There are two separate issues here, says Ray Townsend, arboretum manager at the Royal Botanic Gardens. 'Some plants are threatened because they can't survive in the habitat – they aren't strong enough or there aren't enough of them, perhaps. But bamboo can take care of itself – it's strong enough to survive if left alone. What is under threat is its habitat. When forest goes, it's converted into something else: then there isn't anywhere for forest plants such as bamboo to grow.'"
      },
      {
        label: "F",
        text: "Around the world, bamboo species are routinely protected as part of forest ecosystem in national parks and reserves, but there is next to nothing that protects bamboo in the wild for its own sake. The UNEP-INBAR report will help conservationists to establish effective measures aimed at protecting valuable wild bamboo species."
      },
      {
        label: "",
        text: "Townsend, too, sees the UNEP-INBAR report as an important step forward in promoting the cause of bamboo conservation. 'Until now, bamboo has been perceived as a second-class plant. When you talk about places like the Amazon, everyone always thinks about hardwoods. Of course, these are significant but there's a tendency to overlook the plants they are associated with, which are often bamboo species.'"
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 1–7. Reading Passage 1 has six sections, A–F. Which section contains the following information? Write the correct letter, A–F, in boxes 1–7 on your answer sheet. NB You may use any letter more than once.",
        questions: [
          {
            id: "q1",
            number: 1,
            type: "matching-headings",
            prompt: "an assessment of current levels of knowledge about bamboo",
            paragraphLabel: "Section",
            answer: "B",
            explanation: "Paragraph B discusses how little we know about bamboo and mentions a report revealing our ignorance of global bamboo resources."
          },
          {
            id: "q2",
            number: 2,
            type: "matching-headings",
            prompt: "a comparison between bamboo and more fragile plants",
            paragraphLabel: "Section",
            answer: "E",
            explanation: "Paragraph E compares bamboo with other plants, noting that bamboo can take care of itself while other plants may not survive in their habitat."
          },
          {
            id: "q3",
            number: 3,
            type: "matching-headings",
            prompt: "details of the commercial significance of bamboo",
            paragraphLabel: "Section",
            answer: "D",
            explanation: "Paragraph D focuses on bamboo's economic value, trade, and commercial uses."
          },
          {
            id: "q4",
            number: 4,
            type: "matching-headings",
            prompt: "a human development that is threatening the availability of bamboo",
            paragraphLabel: "Section",
            answer: "A",
            explanation: "Paragraph A mentions how populations have exploded and bamboo forests have been cleared for commercial plantations."
          },
          {
            id: "q5",
            number: 5,
            type: "matching-headings",
            prompt: "a description of the limited extent of existing research on bamboo",
            paragraphLabel: "Section",
            answer: "B",
            explanation: "Paragraph B states that only 38 'priority species' have been the subject of real scientific research."
          },
          {
            id: "q6",
            number: 6,
            type: "matching-headings",
            prompt: "examples of the uses to which bamboo is put",
            paragraphLabel: "Section",
            answer: "D",
            explanation: "Paragraph D lists various uses of bamboo including flooring, laminates, construction, and paper."
          },
          {
            id: "q7",
            number: 7,
            type: "matching-headings",
            prompt: "an explanation of how bamboo may contribute to the survival of range of plants",
            paragraphLabel: "Section",
            answer: "C",
            explanation: "Paragraph C explains how bamboo's pattern of mass flowering and death creates patches that help preserve plant diversity."
          }
        ]
      },
      {
        instructions: "Questions 8–11. Look at the following statements (Questions 8–11) and the list of people below. Match each statement with the correct person, A–D. NB You may use any letter more than once.",
        questions: [
          {
            id: "q8",
            number: 8,
            type: "multiple-choice",
            prompt: "Some people do not regard bamboo as an endangered plant species.",
            options: [
              { key: "A", text: "Ian Redmond" },
              { key: "B", text: "Valerie Kapos" },
              { key: "C", text: "Chris Stapleton" },
              { key: "D", text: "Ray Townsend" }
            ],
            answer: "B",
            explanation: "Valerie Kapos is quoted saying 'In a lot of places, the people who live with bamboo don't perceive it as being under threat in any way.'"
          },
          {
            id: "q9",
            number: 9,
            type: "multiple-choice",
            prompt: "A scarcity of bamboo places certain wildlife under threat.",
            options: [
              { key: "A", text: "Ian Redmond" },
              { key: "B", text: "Valerie Kapos" },
              { key: "C", text: "Chris Stapleton" },
              { key: "D", text: "Ray Townsend" }
            ],
            answer: "A",
            explanation: "Ian Redmond states that without bamboo, the chances of survival for mountain gorillas would be reduced significantly."
          },
          {
            id: "q10",
            number: 10,
            type: "multiple-choice",
            prompt: "Research methods investigating endangered plants have yet to be fully developed.",
            options: [
              { key: "A", text: "Ian Redmond" },
              { key: "B", text: "Valerie Kapos" },
              { key: "C", text: "Chris Stapleton" },
              { key: "D", text: "Ray Townsend" }
            ],
            answer: "B",
            explanation: "Dr Valerie Kapos says 'People have only started looking at this during the past 10-15 years, and only now are they understanding how to go about it systematically.'"
          },
          {
            id: "q11",
            number: 11,
            type: "multiple-choice",
            prompt: "The greatest danger to bamboo is disturbance of the places it grows in.",
            options: [
              { key: "A", text: "Ian Redmond" },
              { key: "B", text: "Valerie Kapos" },
              { key: "C", text: "Chris Stapleton" },
              { key: "D", text: "Ray Townsend" }
            ],
            answer: "D",
            explanation: "Ray Townsend states 'What is under threat is its habitat. When forest goes, it's converted into something else.'"
          }
        ]
      },
      {
        instructions: "Questions 12 and 13. Answer the questions below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        questions: [
          {
            id: "q12",
            number: 12,
            type: "sentence-completion",
            before: "What ecological problem do the roots of bamboo help to control?",
            after: "",
            maxWords: 2,
            answer: ["soil erosion"],
            explanation: "Paragraph C states 'Its rhizome systems, which lie in the top layers of the soil, are crucial in preventing soil erosion.'"
          },
          {
            id: "q13",
            number: 13,
            type: "sentence-completion",
            before: "Which bamboo product is undergoing market expansion?",
            after: "",
            maxWords: 2,
            answer: ["paper"],
            explanation: "Paragraph D mentions 'one of the fastest growing bamboo products is paper'."
          }
        ]
      }
    ]
  },

  // TEST 4 - PASSAGE 2
  {
    slug: "renewable-energy",
    title: "Renewable Energy",
    subtitle: "An insight into the progress in renewable energy research",
    paragraphs: [
      {
        label: "",
        text: "The race is on for the ultimate goal of renewable energy: electricity production at prices that are competitive with coal-fired power stations, but without coal's pollution. Some new technologies are aiming to be the first to push coal from its position as Australia's chief source of electricity."
      },
      {
        label: "",
        text: "At the moment the front-runner in renewable energy is wind technology. According to Peter Bergin of Australian Hydro, one of Australia's leading wind energy companies, there have been no dramatic changes in windmill design for many years, but the cumulative effects of numerous small improvements have had a major impact on cost. 'We're reaping the benefits of 30 years of research in Europe, without having to make the same mistakes that they did,' Mr. Bergin says."
      },
      {
        label: "",
        text: "Electricity can be produced from coal at around 4 cents per kilowatt-hour, but only if the environmental costs are ignored. 'Australia has the second cheapest electricity in the world, and this makes it difficult for renewable to compete,' says Richard Hunter of the Australian Ecogeneration Association (AEA). Nevertheless, the AEA reports: 'The production cost of a kilowatt-hour of wind power is one fifth of what it was 20 years ago,' or around 7 cents per kilowatt-hour."
      },
      {
        label: "",
        text: "Australian Hydro has dozens of wind monitoring stations across Australia as part of its aim to become Australia's pre-eminent renewable energy company. Despite all these developments, wind power remains one of the few forms of alternative energy where Australia is nowhere near the global cutting edge, mostly just replicating European designs."
      },
      {
        label: "",
        text: "While wind may currently lead the way, some consider a number of technologies under development have more potential. In several cases, Australia is at the forefront of global research in the area. Some of them are very site-specific, ensuring that they may never become dominant market players. On the other hand, these newer developments are capable of providing more reliable power, avoiding the major criticism of windmills – the need for back-up on a calm day."
      },
      {
        label: "",
        text: "One such development uses hot, dry rocks. Deep beneath South Australia, radiation from elements contained in granite heats the rocks. Layers of insulating sedimentation raise the temperatures in some location to 250° centigrade. An Australian firm, Geoenergy, is proposing to pump water 3.5 kilometres into the earth, where it will travel through tiny fissures in the granite, heating up as it goes, until it escapes as steam through another drilled hole."
      },
      {
        label: "",
        text: "No greenhouse gases are produced, but the system needs some additional features if it is to be environmentally friendly. Dr Prue Chopra, a geophysicist at the Australian National University and one of the founders of Geoenergy, note that the steam will bring with it radon gas, along through a heat exchanger and then sent back underground for another cycle. Technically speaking, hot dry rocks are not a renewable source of energy. However, the Australian source is so large it could supply the entire country's needs for thousands of years at current rates of consumption."
      },
      {
        label: "",
        text: "Two other proposals for very different ways to harness sun and wind energy have surfaced recently. Progress continues with Australian company EnviroPower's plans for Australia's first solar chimney near Mildura, in Victoria. Under this scheme, a tall tower will draw hot air from a greenhouse built to cover the surrounding 5km². As the air rises, it will drive a turbine to produce electricity. The solar tower combines three very old technologies – the chimney, the turbine and the greenhouse – to produce something quite new. It is this reliance on proven engineering principles that led Enviropower's CEO, Richard Davies, to state: 'There is no doubt this technology will work, none at all.'"
      },
      {
        label: "",
        text: "This year, Enviropower recognized that the quality of sunlight in the Mildura district will require a substantially larger collecting area than was previously thought. However, spokesperson Kay Firth says that a new location closer to Mildura will enable Enviropower to balance the increased costs with extra revenue. Besides saving in transmission costs, the new site 'will mean increased revenue from tourism and use of power for telecommunications. We'll also be able to use the outer 500 metres for agribusiness.' Wind speeds closer to the tower will be too high for farming."
      },
      {
        label: "",
        text: "Another Australian company, Wavetech, is achieving success with ways of harvesting the energy in waves. Wavetech's invention uses a curved surface to push waves into a chamber, where the flowing water column pushes air back and forth through a turbine. Wavetech was created when Dr. Tim Devine offered the idea to the world leader in wave generator manufacturers, who rather surprisingly rejected it. Dr. Devine responded by establishing Wavetech, and making a number of other improvements to generator design. Wavetech claims that, at appropriate sites, 'the cost of electricity produced with our technology should be below 4 cents per kilowatt-hour.'"
      },
      {
        label: "",
        text: "The diversity of forms of greenhouse-friendly energy under development in Australia is remarkable. However, support on a national level is disappointing. According to Richard Hunter of the AEA, 'Australia has huge potential for wind, sun and wave technology. We should really be at the forefront, but the reality is we are a long way behind.'"
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 14–20. Do the following statements agree with the information given in Reading Passage 2? In boxes 14–20 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q14",
            number: 14,
            type: "true-false-not-given",
            prompt: "In Australia, alternative energies are less expensive than conventional electricity.",
            answer: "FALSE",
            explanation: "The passage states that wind power costs around 7 cents per kilowatt-hour while coal costs 4 cents, making alternative energy more expensive."
          },
          {
            id: "q15",
            number: 15,
            type: "true-false-not-given",
            prompt: "Geoenergy needs to adapt its system to make it less harmful to the environment.",
            answer: "TRUE",
            explanation: "The passage states 'the system needs some additional features if it is to be environmentally friendly' and mentions radon gas needs to be removed."
          },
          {
            id: "q16",
            number: 16,
            type: "true-false-not-given",
            prompt: "Dr. Prue Chopra has studied the effects of radon gas on the environment.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions Dr. Chopra notes that steam will bring radon gas, but does not state she has studied its environmental effects."
          },
          {
            id: "q17",
            number: 17,
            type: "true-false-not-given",
            prompt: "Hot, dry rocks could provide enough power for the whole of Australia.",
            answer: "TRUE",
            explanation: "The passage states 'the Australian source is so large it could supply the entire country's needs for thousands of years'."
          },
          {
            id: "q18",
            number: 18,
            type: "true-false-not-given",
            prompt: "The new Enviropower facility will keep tourists away.",
            answer: "FALSE",
            explanation: "The passage states the new site 'will mean increased revenue from tourism', suggesting tourists will be attracted, not kept away."
          },
          {
            id: "q19",
            number: 19,
            type: "true-false-not-given",
            prompt: "Wavetech was established when its founders were turned down by another company.",
            answer: "TRUE",
            explanation: "The passage states 'Wavetech was created when Dr. Tim Devine offered the idea to the world leader in wave generator manufacturers, who rather surprisingly rejected it.'"
          },
          {
            id: "q20",
            number: 20,
            type: "true-false-not-given",
            prompt: "According to the AEA, Australia is a world leader in developing renewable energy.",
            answer: "FALSE",
            explanation: "Richard Hunter of the AEA states 'We should really be at the forefront, but the reality is we are a long way behind.'"
          }
        ]
      },
      {
        instructions: "Questions 21–26. Look at the following statements (Questions 21–26) and the list of companies below. Match each statement with the correct company, A–D. Write the correct letter, A–D, in boxes 21–26 on your answer sheet. NB You may use any letter more than once.",
        questions: [
          {
            id: "q21",
            number: 21,
            type: "multiple-choice",
            prompt: "During the process, harmful substances are prevented from escaping.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "B",
            explanation: "Geoenergy's system sends radon gas through a heat exchanger and back underground to prevent it from escaping."
          },
          {
            id: "q22",
            number: 22,
            type: "multiple-choice",
            prompt: "Water is used to force air through a special device.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "D",
            explanation: "Wavetech's invention uses waves to push water into a chamber where the flowing water column pushes air through a turbine."
          },
          {
            id: "q23",
            number: 23,
            type: "multiple-choice",
            prompt: "Techniques used by other countries are being copied.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "A",
            explanation: "Australian Hydro is 'mostly just replicating European designs' for wind power."
          },
          {
            id: "q24",
            number: 24,
            type: "multiple-choice",
            prompt: "The system can provide services other than energy production.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "C",
            explanation: "Enviropower's new site will provide revenue from tourism, telecommunications, and agribusiness in addition to energy."
          },
          {
            id: "q25",
            number: 25,
            type: "multiple-choice",
            prompt: "It is planned to force water deep under the ground.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "B",
            explanation: "Geoenergy 'is proposing to pump water 3.5 kilometres into the earth'."
          },
          {
            id: "q26",
            number: 26,
            type: "multiple-choice",
            prompt: "Original estimates for part of the project have been revised.",
            options: [
              { key: "A", text: "Australian Hydro" },
              { key: "B", text: "Geoenergy" },
              { key: "C", text: "Enviropower" },
              { key: "D", text: "Wavetech" }
            ],
            answer: "C",
            explanation: "Enviropower 'recognized that the quality of sunlight in the Mildura district will require a substantially larger collecting area than was previously thought.'"
          }
        ]
      }
    ]
  },

  // TEST 4 - PASSAGE 3
  {
    slug: "inside-the-mind-of-a-fan",
    title: "Inside the mind of a fan",
    subtitle: "How watching sport affects the brain",
    paragraphs: [
      {
        label: "A",
        text: "At about the same time that the poet Homer invented the epic hero, the ancient Greeks started a festival in which men competed in a single race, about 200 metres long. The winner received a branch of wild olives. The Greeks called this celebration the Olympics. Through the ancient sprint remains, today the Olympics are far more than that. Indeed, the Games seem to celebrate the dream of progress as embodied in the human form. That the Games are intoxicating to watch is beyond question. During the Athens Olympics in 2004, 3.4 billion people, half the world, watched them on television. Certainly, being a spectator is a thrilling experience: but why?"
      },
      {
        label: "B",
        text: "In 1996, three Italian neuroscientists, Giacomo Rizzolatti, Leonardo Fogassi and Vittorio Gallese, examined the premotor cortex of monkeys. They discovered that inside these primate brains there were groups of cells that 'store vocabularies of motor actions'. Just as there are grammars of movement. These networks of cells are the bodily 'sentences' we use every day, the ones our brain has chosen to retain and refine. Think, for example, about a golf swing. To those who have only watched the Masters' Tournament on TV, golfing seems easy. To the novice, however, the skill of casting a smooth arc with a lop-side metal stick is virtually impossible. This is because most novices swing with their consciousness, using an area of brain next to the premotor cortex. To the expert, on the other hand, a perfectly balanced stroke is second nature. For him, the motor action has become memorized, and the movements are embedded in the neurons of his premotor cortex. He hits the ball with the tranquility of his perfected autopilot."
      },
      {
        label: "C",
        text: "These neurons in the premotor cortex, besides explaining why certain athletes seem to possess almost unbelievable levels of skill, have an even more amazing characteristic, one that caused Rizzolatti, Fogassi and Gallese to give them the lofty title 'mirror neurons'. They note, 'The main functional characteristic of mirror neurons is that they become active both when the monkey performs a particular action (for example, grasping an object or holding it) and, astonishingly, when it sees another individual performing a similar action.' Humans have an even more elaborate mirror neuron system. These peculiar cells mirror, inside the brain, the outside world: they enable us to internalise the actions of another. In order to be activated, though, these cells require what the scientists call 'goal-orientated movements'. If we are staring at a photograph, a fixed image of a runner mid-stride, our mirror neurons are totally silent. They only fire when the runner is active: running, moving or sprinting."
      },
      {
        label: "D",
        text: "What these electrophysiological studies indicate is that when we watch a golfer or a runner in action, the mirror neurons in our own premotor cortex light up as if we were the ones competing. This phenomenon of neural mirror was first discovered in 1954, when two French physiologists, Gastaut and Berf, found that the brains of humans vibrate with two distinct wavelengths, alpha and mu. The mu system is involved in neural mirroring. It is active when your bodies are still, and disappears whenever we do something active, like playing sport or changing the TV channel. The surprising fact is that the mu signal is also quiet when we watch someone else being active, as on TV, these results are the effect of mirror neurons."
      },
      {
        label: "E",
        text: "Rizzolatti, Fogassi and Gallese call the idea of mirror neurons the 'direct matching hypothesis'. They believe that we only understand the movement of sports stars when we 'map the visual representation of the observed action onto our motor representation of the same action'. According to this theory, watching an Olympic athlete 'causes the motor system of the observer to resonate. The \"motor knowledge\" of the observer is used to understand the observed action.' But mirror neurons are more than just the neural basis for our attitude to sport. It turns out that watching a great golfer makes us better golfers, and watching a great sprinter actually makes us run faster. This ability to learn by watching is a crucial skill. From the acquisition of language as infants to learning facial expressions, mimesis (copying) is an essential part of being conscious. The best athletes are those with a premotor cortex capable of imagining the movements of victory, together with the physical properties to make those movements real."
      },
      {
        label: "F",
        text: "But how many of us regularly watch sports in order to be a better athlete? Rather, we watch sport for the feeling, the human drama. This feeling also derives from mirror neurons. By letting spectators share in the motions of victory, they also allow us to share in its feelings. This is because they are directly connected to the amygdalae, one of the main brain regions involved in emotion. During the Olympics, the mirror neurons of whole nations will be electrically identical, their athletes causing spectators to feel, just for a second or two, the same thing. Watching sports brings people together. Most of us will never run a mile in under four minutes, or hit a home run. Our consolation comes in watching, when we gather around the TV, we all feel, just for a moment, what it is to do something perfectly."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 27–32. Reading Passage 3 has six paragraphs, A–F. Which paragraph contains the following information? Write the correct letter, A–F, in boxes 27–32 on your answer sheet. NB You may use any letter more than once.",
        questions: [
          {
            id: "q27",
            number: 27,
            type: "matching-headings",
            prompt: "an explanation of why watching sport may be emotionally satisfying",
            paragraphLabel: "Paragraph",
            answer: "F",
            explanation: "Paragraph F explains how mirror neurons allow spectators to share in the feelings of victory through connection to the amygdalae."
          },
          {
            id: "q28",
            number: 28,
            type: "matching-headings",
            prompt: "an explanation of why beginners find sporting tasks difficult",
            paragraphLabel: "Paragraph",
            answer: "B",
            explanation: "Paragraph B explains that novices swing with their consciousness using an area of brain next to the premotor cortex, making skills difficult."
          },
          {
            id: "q29",
            number: 29,
            type: "matching-headings",
            prompt: "a factor that needs to combine with mirroring to attain sporting excellence",
            paragraphLabel: "Paragraph",
            answer: "E",
            explanation: "Paragraph E states 'The best athletes are those with a premotor cortex capable of imagining the movements of victory, together with the physical properties to make those movements real.'"
          },
          {
            id: "q30",
            number: 30,
            type: "matching-headings",
            prompt: "a comparison of human and animal mirror neurons",
            paragraphLabel: "Paragraph",
            answer: "C",
            explanation: "Paragraph C states 'Humans have an even more elaborate mirror neuron system' compared to monkeys."
          },
          {
            id: "q31",
            number: 31,
            type: "matching-headings",
            prompt: "the first discovery of brain activity related to mirror neurons",
            paragraphLabel: "Paragraph",
            answer: "D",
            explanation: "Paragraph D mentions that 'This phenomenon of neural mirror was first discovered in 1954, when two French physiologists, Gastaut and Berf, found that the brains of humans vibrate with two distinct wavelengths'."
          },
          {
            id: "q32",
            number: 32,
            type: "matching-headings",
            prompt: "a claim linking observation to improvement in performance",
            paragraphLabel: "Paragraph",
            answer: "E",
            explanation: "Paragraph E states 'watching a great golfer makes us better golfers, and watching a great sprinter actually makes us run faster.'"
          }
        ]
      },
      {
        instructions: "Questions 33–35. Choose the correct letter, A, B, C or D.",
        questions: [
          {
            id: "q33",
            number: 33,
            type: "multiple-choice",
            prompt: "The writer uses the term 'grammar of movement' to mean",
            options: [
              { key: "A", text: "a level of sporting skill." },
              { key: "B", text: "a system of words about movement." },
              { key: "C", text: "a pattern of connected cells." },
              { key: "D", text: "a type of golf swing." }
            ],
            answer: "C",
            explanation: "Paragraph B states 'These networks of cells are the bodily \"sentences\" we use every day' and refers to them as 'grammars of movement', meaning patterns of connected cells."
          },
          {
            id: "q34",
            number: 34,
            type: "multiple-choice",
            prompt: "The writer states that expert players perform their actions",
            options: [
              { key: "A", text: "without conscious thought." },
              { key: "B", text: "by planning each phase of movement." },
              { key: "C", text: "without regular practice." },
              { key: "D", text: "by thinking about the actions of others." }
            ],
            answer: "A",
            explanation: "Paragraph B states 'For him, the motor action has become memorized, and the movements are embedded in the neurons of his premotor cortex. He hits the ball with the tranquility of his perfected autopilot.'"
          },
          {
            id: "q35",
            number: 35,
            type: "multiple-choice",
            prompt: "The writer states that the most common motive for watching sport is to",
            options: [
              { key: "A", text: "improve personal performance." },
              { key: "B", text: "feel linked with people of different nationalities." },
              { key: "C", text: "experience strong positive emotions." },
              { key: "D", text: "realize what skill consists of." }
            ],
            answer: "C",
            explanation: "Paragraph F states 'Rather, we watch sport for the feeling, the human drama' and explains how mirror neurons allow spectators to share in the feelings of victory."
          }
        ]
      },
      {
        instructions: "Questions 36–40. Do the following statements agree with the views of the writer in Reading Passage 3? In boxes 36–40 on your answer sheet, write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
        questions: [
          {
            id: "q36",
            number: 36,
            type: "yes-no-not-given",
            prompt: "Inexpert sports players are too aware of what they are doing.",
            answer: "YES",
            explanation: "Paragraph B states that novices 'swing with their consciousness', meaning they are too aware of what they are doing."
          },
          {
            id: "q37",
            number: 37,
            type: "yes-no-not-given",
            prompt: "Monkeys have a more complex mirror neuron system than humans.",
            answer: "NO",
            explanation: "Paragraph C states 'Humans have an even more elaborate mirror neuron system', contradicting the statement."
          },
          {
            id: "q38",
            number: 38,
            type: "yes-no-not-given",
            prompt: "Looking at a photograph can activate mirror neurons.",
            answer: "NO",
            explanation: "Paragraph C states 'If we are staring at a photograph, a fixed image of a runner mid-stride, our mirror neurons are totally silent.'"
          },
          {
            id: "q39",
            number: 39,
            type: "yes-no-not-given",
            prompt: "Gastaut and Bert were both researchers and sports players.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions Gastaut and Bert were researchers but does not state whether they were also sports players."
          },
          {
            id: "q40",
            number: 40,
            type: "yes-no-not-given",
            prompt: "The mu system is at rest when we are engaged in an activity.",
            answer: "YES",
            explanation: "Paragraph D states 'The mu system is involved in neural mirroring. It is active when your bodies are still, and disappears whenever we do something active', meaning it is at rest when we are engaged in an activity."
          }
        ]
      }
    ]
  },

  // TEST 5 - PASSAGE 1
  {
    slug: "caral-ancient-south-american-city",
    title: "Caral: an ancient South American city",
    subtitle: "",
    paragraphs: [
      {
        label: "",
        text: "Huge earth and rock mounds rise out of the desert of the Supe Valley near the coast of Peru in South America. These immense mounds appear simply to be part of the geographical landscape in this arid region squeezed between the Pacific Ocean and the Andes mountains. But looks deceive. These are actually human-made pyramids. Strong evidence indicates they are the remains of a city known as Caral that flourished nearly 5,000 years ago. If true, it would be the oldest known urban centre in the Americas and among the most ancient in the world."
      },
      {
        label: "",
        text: "Research undertaken by Peruvian archaeologist Ruth Shady suggests that the 150-acre complex of pyramids, plazas and residential buildings was a thriving metropolis when Egypt's great pyramids were still being built. Though discovered in 1905, for years Caral attracted little attention, largely because archaeologists believed the structures were fairly recent. But the monumental scale of the pyramids had long interested Shady, who began excavations at the site in 1996, about 22 kilometres from the coast and 190 kilometres north of Peru's capital city of Lima."
      },
      {
        label: "",
        text: "Shady and her crew searched for broken remains of the pots and containers that most such sites contain. Not finding any only made her more excited: it meant Caral could be what archaeologists term pre-ceramic, that is, existing before the advent in the area of pot-firing techniques. Shady's team undertook the task of excavating Piramide Mayor, the largest of the pyramids. After carefully clearing away many hundreds of years' worth of rubble and sand, they identified staircases, walls covered with remnants of coloured plaster, and brickwork. In the foundations, they found the remains of grass-like reeds woven into bags. The original workers, she surmised, must have filled these bags with stones from a nearby quarry and laid them atop one another inside retaining walls, gradually giving rise to the pyramid's immense structure. Shady had samples of the reeds subjected to radiocarbon dating and found that the reeds were 4,600 years old. This evidence indicated that Caral was, in fact, more than 1,000 years older than what had previously been thought to be the oldest urban centre in the Americas."
      },
      {
        label: "",
        text: "What amazed archaeologists was not just the age, but the complexity and scope of Caral. Piramide Mayor alone covers an area nearly the size of four football fields and is 18 metres tall. A nine-metre-wide staircase rises from a circular plaza at the foot of the pyramid, passing over three terraced levels until it reaches the top. Thousands of manual labourers would have been needed to build such a project, not counting the many architects, craftsmen, and managers. Shady's team found the remains of a large amphitheatre, containing almost 70 musical instruments made of bird and deer bones. Clearly music played an important role in Caral's society. Around the perimeter of Caral are a series of smaller mounds and various buildings. These indicate a hierarchy of living arrangements: large, well-kept rooms atop pyramids for the elite, ground-level quarters for the middle class, and shabbier outlying dwellings for workers."
      },
      {
        label: "",
        text: "But why had Caral been built in the first place? Her excavations convinced Shady that Caral once served as a trade centre for the region, which extends from the rainforests of the Amazon to the high forests of the Andes. Shady found evidence of a rich trading environment, including seeds of the cocoa bush and necklaces of shells, neither of which was native to the immediate Caral area. This environment gave rise to people who did not take part in the production of food, allowing them to become priests and planners, builders and designers. Thus occupational specialisation, elemental to an urban society, emerged."
      },
      {
        label: "",
        text: "But what sustained such a trading centre and drew travellers to it? Was it food? Shady and her team found the bones of small edible fish, which must have come from the Pacific coast to the west, in the excavations. But they also found evidence of squash, sweet potatoes and beans having been grown locally. Shady theorised that Caral's early farmers diverted the area's rivers into canals, which still cross the Supe Valley today, to irrigate their fields. But because she found no traces of maize, which can be traded or stored and used in times of crop failure, she concluded that Caral's trade leverage was not based on stockpiling food supplies."
      },
      {
        label: "",
        text: "It was evidence of another crop in the excavations that gave Shady the best clue to Caral's success. In nearly every excavated building, her team discovered evidence of cotton – seeds, fibres and textiles. Her theory fell into place when a large fishing net made of those fibres, unearthed in an unrelated dig on Peru's coast, turned out to be as old as Caral. 'The farmers of Caral grew the cotton that the fishermen needed to make their nets,' Shady speculates. 'And the fishermen gave them shellfish and dried fish in exchange for these nets.' In essence, the people of Caral enabled fishermen to work with larger and more effective nets, which made the resources of the sea more readily available, and the fishermen probably used dried squash grown by the Caral people as flotation devices for their nets."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 1–6. Do the following statements agree with the information given in Reading Passage 1? In boxes 1–6 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q1",
            number: 1,
            type: "true-false-not-given",
            prompt: "Caral was built at the same time as the construction of the Egyptian pyramids.",
            answer: "FALSE",
            explanation: "The passage states that Caral 'was a thriving metropolis when Egypt's great pyramids were still being built', meaning Caral existed while pyramids were being built, not that they were built at the same time."
          },
          {
            id: "q2",
            number: 2,
            type: "true-false-not-given",
            prompt: "The absence of pottery at the archaeological dig gave Shady a significant clue to the age of the site.",
            answer: "TRUE",
            explanation: "The passage states that not finding pottery 'meant Caral could be what archaeologists term pre-ceramic', which was a significant clue about its age."
          },
          {
            id: "q3",
            number: 3,
            type: "true-false-not-given",
            prompt: "The stones used to build Piramide Mayor came from a location far away.",
            answer: "FALSE",
            explanation: "The passage states the workers 'must have filled these bags with stones from a nearby quarry', not from far away."
          },
          {
            id: "q4",
            number: 4,
            type: "true-false-not-given",
            prompt: "The huge and complicated structures of Piramide Mayor suggest that its construction required an organised team of builders.",
            answer: "TRUE",
            explanation: "The passage states 'Thousands of manual labourers would have been needed to build such a project, not counting the many architects, craftsmen, and managers.'"
          },
          {
            id: "q5",
            number: 5,
            type: "true-false-not-given",
            prompt: "Archaeological evidence shows that the residents of Caral were highly skilled musicians.",
            answer: "NOT GIVEN",
            explanation: "The passage states they found musical instruments and that 'Clearly music played an important role in Caral's society', but does not state whether the residents were highly skilled musicians."
          },
          {
            id: "q6",
            number: 6,
            type: "true-false-not-given",
            prompt: "The remains of housing areas at Caral suggest that there were no class distinctions in residential areas.",
            answer: "FALSE",
            explanation: "The passage states 'These indicate a hierarchy of living arrangements: large, well-kept rooms atop pyramids for the elite, ground-level quarters for the middle class, and shabbier outlying dwellings for workers.'"
          }
        ]
      },
      {
        instructions: "Questions 7–13. Complete the notes below. Choose ONE WORD ONLY from the passage for each answer. Write your answers in boxes 7–13 on your answer sheet.",
        questions: [
          {
            id: "q7",
            number: 7,
            type: "sentence-completion",
            before: "the",
            after: "of a certain plant",
            maxWords: 1,
            answer: ["seeds"],
            explanation: "The passage mentions 'seeds of the cocoa bush' as items discovered at Caral."
          },
          {
            id: "q8",
            number: 8,
            type: "sentence-completion",
            before: "",
            after: "used to make jewellery",
            maxWords: 1,
            answer: ["shells"],
            explanation: "The passage mentions 'necklaces of shells' as items discovered at Caral."
          },
          {
            id: "q9",
            number: 9,
            type: "sentence-completion",
            before: "the remains of certain food such as",
            after: "",
            maxWords: 1,
            answer: ["fish"],
            explanation: "The passage states they found 'the bones of small edible fish' in the excavations."
          },
          {
            id: "q10",
            number: 10,
            type: "sentence-completion",
            before: "",
            after: "still in existence today indicate water diverted from rivers",
            maxWords: 1,
            answer: ["canals"],
            explanation: "The passage states 'Caral's early farmers diverted the area's rivers into canals, which still cross the Supe Valley today'."
          },
          {
            id: "q11",
            number: 11,
            type: "sentence-completion",
            before: "no evidence that",
            after: "was grown",
            maxWords: 1,
            answer: ["maize"],
            explanation: "The passage states 'she found no traces of maize'."
          },
          {
            id: "q12",
            number: 12,
            type: "sentence-completion",
            before: "the excavation findings and fishing nets found on the coast suggest Caral farmers traded",
            after: "",
            maxWords: 1,
            answer: ["cotton"],
            explanation: "The passage states 'The farmers of Caral grew the cotton that the fishermen needed to make their nets'."
          },
          {
            id: "q13",
            number: 13,
            type: "sentence-completion",
            before: "dried squash may have been used to aid",
            after: "of fishing nets",
            maxWords: 1,
            answer: ["flotation"],
            explanation: "The passage states 'the fishermen probably used dried squash grown by the Caral people as flotation devices for their nets'."
          }
        ]
      }
    ]
  },

  // TEST 5 - PASSAGE 2
  {
    slug: "should-space-be-explored-by-robots-or-humans",
    title: "Should space be explored by robots or by humans?",
    subtitle: "",
    headingBank: [
      { id: "i", text: "Robots on Earth – a re-evaluation" },
      { id: "ii", text: "The barriers to cooperation in space exploration" },
      { id: "iii", text: "Some limitations of robots in space" },
      { id: "iv", text: "Reduced expectations for space exploration" },
      { id: "v", text: "A general reconsideration of human/robot responsibilities in space" },
      { id: "vi", text: "Problems in using humans for space exploration" },
      { id: "vii", text: "The danger to humans of intelligent machines" },
      { id: "viii", text: "Space settlement and the development of greater self-awareness" },
      { id: "ix", text: "Possible examples of cooperation in space" }
    ],
    paragraphs: [
      {
        label: "A",
        text: "The advisability of humans participating directly in space travel continues to cause many debates. There is no doubt that the presence of people on board a space vehicle makes its design much more complex and challenging, and produces a large increase in costs, since safety requirements are greatly increased, and the technology providing necessities for human passengers such as oxygen, food and water must be guaranteed. Moreover, the systems required are bulky and costly, and their complexity increases for long-duration missions. Meanwhile, advances in electronics and computer science allow increasingly complex tasks to be entrusted to robots, and unmanned space probes are becoming lighter, smaller and more convenient."
      },
      {
        label: "B",
        text: "However, experience has shown that the idea of humans in space is popular with the public. Humans can also be useful; there are many cases when only direct intervention by an astronaut or cosmonaut can correct the malfunction of an automatic device. Astronauts and cosmonauts have proved that they can adapt to conditions of weightlessness and work in space without encountering too many problems, as was seen in the operations to repair and to upgrade the Hubble Space Telescope. One human characteristic which is particularly precious in space missions, and which so far is lacking in robots, is the ability to perform a great variety of tasks. In addition, robots are not good at reacting to situations they have not been specifically prepared for. This is especially important in the case of deep space missions. While, in the case of the Moon, it is possible for someone on Earth to 'tele-operate' a robotic device such as a probe, as the two-way link time is only a couple of seconds, on Mars the two-way link time is several minutes, so sending instructions from Earth is more difficult."
      },
      {
        label: "C",
        text: "Many of the promises of artificial intelligence are still far from being fulfilled. The construction of machines simulating human logical reasoning moves towards ever more distant dates. The more the performance of computers improves, the more we realise how difficult it is to build machines which display logical abilities. In the past it was confidently predicted that we would soon have fully automated factories in which all operations were performed without any human intervention, and forecasts of the complete substitution of workers by robots in many production areas were made. Today, these perspectives are being revised. It seems that all machines, even the smartest ones, must cooperate with humans. Rather than replacing humans, the present need appears to be for an intelligent machine capable of helping a human operator without replacing him or her. The word 'cobot', from 'collaborative robot', has been invented to designate this type of machine."
      },
      {
        label: "D",
        text: "A similar trend is also apparent in the field of space exploration. Tasks which were in the past entrusted only to machines are now performed by human beings, sometimes with the aim of using simpler and less costly devices, sometimes to obtain better performance. In many cases, to involve a person in the control loop is a welcome simplification which may lower the cost of a mission without compromising safety. Many operations originally designed to be performed under completely automatic control can be performed more efficiently by astronauts, perhaps helped by their 'cobots'. The human-machine relationship must evolve towards a closer collaboration."
      },
      {
        label: "E",
        text: "One way this could happen is by adopting the Mars Outposts approach, proposed by the Planetary Society. This would involve sending a number of robotic research stations to Mars, equipped with permanent communications and navigational systems. They would perform research, and establish the infrastructure needed to prepare future landing sites for the exploration of Mars by humans. It has also been suggested that in the most difficult environments, as on Venus or Jupiter, robots could be controlled by human beings located in spaceships which remain in orbit around the planet. In this case the link time for communication between humans and robots would be far less than it would be from Earth."
      },
      {
        label: "F",
        text: "But if space is to be more than a place to build automatic laboratories or set up industrial enterprises in the vicinity of our planet, the presence of humans is essential. They must learn how to voyage through space towards destinations which will be not only scientific bases but also places to live. If space is a frontier, that frontier must see the presence of people. So the aim for humankind in the future will be not just the exploration of space, but its colonisation. The result of exploring and living in space may be a deep change in the views which humankind has of itself. And this process is already under way. The images of Earth taken from the Moon in the Apollo programme have given humankind a new consciousness of its fragility, its smallness, and its unity. These impressions have triggered a realisation of the need to protect and preserve it, for it is the place in the solar system most suitable for us and above all it is the only place we have, at least for now."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 14–19. Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each paragraph from the list of headings below. Write the correct number, i–ix, in boxes 14–19 on your answer sheet.",
        questions: [
          {
            id: "q14",
            number: 14,
            type: "matching-headings",
            prompt: "Paragraph A",
            paragraphLabel: "Paragraph A",
            answer: "vi",
            explanation: "Paragraph A discusses the problems and costs of using humans in space exploration."
          },
          {
            id: "q15",
            number: 15,
            type: "matching-headings",
            prompt: "Paragraph B",
            paragraphLabel: "Paragraph B",
            answer: "iii",
            explanation: "Paragraph B discusses limitations of robots, including their inability to react to unprepared situations."
          },
          {
            id: "q16",
            number: 16,
            type: "matching-headings",
            prompt: "Paragraph C",
            paragraphLabel: "Paragraph C",
            answer: "i",
            explanation: "Paragraph C discusses how predictions about AI and robots are being revised, representing a re-evaluation."
          },
          {
            id: "q17",
            number: 17,
            type: "matching-headings",
            prompt: "Paragraph D",
            paragraphLabel: "Paragraph D",
            answer: "v",
            explanation: "Paragraph D discusses how humans and machines are now working together in space, a reconsideration of responsibilities."
          },
          {
            id: "q18",
            number: 18,
            type: "matching-headings",
            prompt: "Paragraph E",
            paragraphLabel: "Paragraph E",
            answer: "ix",
            explanation: "Paragraph E gives examples of how humans and robots could cooperate in space exploration."
          },
          {
            id: "q19",
            number: 19,
            type: "matching-headings",
            prompt: "Paragraph F",
            paragraphLabel: "Paragraph F",
            answer: "viii",
            explanation: "Paragraph F discusses space settlement and how living in space changes human self-awareness."
          }
        ]
      },
      {
        instructions: "Questions 20 and 21. Choose TWO letters, A–E. Write the correct letters in boxes 20 and 21 on your answer sheet. According to the writer, which TWO predictions about artificial intelligence have not yet been fulfilled?",
        questions: [
          {
            id: "q20",
            number: 20,
            type: "multiple-choice",
            prompt: "Box 20",
            options: [
              { key: "A", text: "Robots will work independently of humans." },
              { key: "B", text: "Robots will begin to oppose human interests." },
              { key: "C", text: "Robots will be used to help humans perform tasks more efficiently." },
              { key: "D", text: "Robots will think in the same way as humans." },
              { key: "E", text: "Robots will become too costly to use on space missions." }
            ],
            answer: "A",
            explanation: "The passage states that predictions about fully automated factories and complete substitution of workers by robots are being revised."
          },
          {
            id: "q21",
            number: 21,
            type: "multiple-choice",
            prompt: "Box 21",
            options: [
              { key: "A", text: "Robots will work independently of humans." },
              { key: "B", text: "Robots will begin to oppose human interests." },
              { key: "C", text: "Robots will be used to help humans perform tasks more efficiently." },
              { key: "D", text: "Robots will think in the same way as humans." },
              { key: "E", text: "Robots will become too costly to use on space missions." }
            ],
            answer: "D",
            explanation: "The passage states that building machines which display logical abilities has proven very difficult."
          }
        ]
      },
      {
        instructions: "Questions 22–26. Complete the summary below. Choose ONE WORD ONLY from the passage for each answer. Write your answers in boxes 22–26 on your answer sheet.",
        questions: [
          {
            id: "q22",
            number: 22,
            type: "sentence-completion",
            before: "One way of exploring space would be through collaboration between humans and robots. For example, when exploring the planet Mars, robots could be used to set up",
            after: "and do initial research before humans arrive.",
            maxWords: 1,
            answer: ["infrastructure"],
            explanation: "Paragraph E states robots would 'establish the infrastructure needed to prepare future landing sites'."
          },
          {
            id: "q23",
            number: 23,
            type: "sentence-completion",
            before: "In other cases, humans could stay in orbiting",
            after: "and give orders to robots working on the surface of the planet.",
            maxWords: 1,
            answer: ["spaceships"],
            explanation: "Paragraph E suggests 'robots could be controlled by human beings located in spaceships which remain in orbit around the planet'."
          },
          {
            id: "q24",
            number: 24,
            type: "sentence-completion",
            before: "This would increase the speed of",
            after: "with the robots.",
            maxWords: 1,
            answer: ["communication"],
            explanation: "The context suggests communication would be faster with humans in orbit rather than on Earth."
          },
          {
            id: "q25",
            number: 25,
            type: "sentence-completion",
            before: "In such ways, robots might be used to work in space in commercial enterprises or",
            after: ".",
            maxWords: 1,
            answer: ["laboratories"],
            explanation: "Paragraph F mentions space as 'a place to build automatic laboratories'."
          },
          {
            id: "q26",
            number: 26,
            type: "sentence-completion",
            before: "However, the final aim of humankind may be the",
            after: "of space and this could in turn change people's attitudes towards Earth.",
            maxWords: 1,
            answer: ["colonisation"],
            explanation: "Paragraph F states 'the aim for humankind in the future will be not just the exploration of space, but its colonisation'."
          }
        ]
      }
    ]
  },

  // TEST 5 - PASSAGE 3
  {
    slug: "the-dark-side-of-the-technological-boom",
    title: "The dark side of the technological boom",
    subtitle: "What are the effects on the individual of working in modern technological workplaces?",
    paragraphs: [
      {
        label: "",
        text: "Changes in the way we work and how our offices are structured come at us faster and faster. Waves of state-of-the-art information technology and instant telecommunications let us reach anyone, anywhere, and speed is the key. Most of us are too busy struggling to keep pace with ongoing innovations to question the implications of our new electronic authority figures. According to a number of psychologists, however, the need to stay on top of the information flow and the extent to which we remain in touch with our offices exact a profound toll on us as individuals."
      },
      {
        label: "",
        text: "Mass exposure to technological innovations in the workplace has come too recently for psychologists to reach a consensus on its societal implications. Many agree, however, that one of the first signs of the struggle to adapt to the electronic office is often 'technostress', a cognitive shift that results from an over-identification with information systems. Psychologist Craig Brod says people become accustomed to the patterns set by electronic tools – accelerated time and yes/no logic – and internalise these patterns. When they leave the office or go home, Brod says, they need complete isolation to recover from the effects of the technology."
      },
      {
        label: "",
        text: "Brod warns that over-reliance on electronic tools could also have serious repercussions on our ability to think creatively and develop new ideas. Because we don't create in a vacuum, he points out, we need to avoid the temptation to replace informal gatherings for bouncing ideas off colleagues with electronic networking. It's also more difficult to spot errors or even evaluate the shape of a project displayed in a flat, two-dimensional way on a screen. Electronically networked offices can also make it increasingly difficult to convince ourselves that we're doing an adequate job and accumulating enough information to make informed decisions. Philosopher Daniel Dennett points out that modern technology eliminates the possibility of unavoidable ignorance. As the opportunity to amass information grows larger, the obligation to make accurate predictions – the right decisions – becomes more onerous. Instead of consoling ourselves that we're doing as good a job as we can, we are tormented by the knowledge that the world of information is limitless."
      },
      {
        label: "",
        text: "For executives near the top of the office pyramid, the benefits of the electronic revolution – like telecommuting and flexible scheduling – may outweigh the disadvantages of being continuously on call. But in Workplace 2000, authors Joseph Boyett and Henry Conn describe a future in which millions of people now charged with analysing information and making routine decisions will be replaced by less skilled workers using 'intelligent' software to make decisions for them. They predict that a cult of performance excellence will engulf most businesses."
      },
      {
        label: "",
        text: "The millions of people on the bottom levels of electronic hierarchies are increasingly likely to spend their days in an isolated no-man's land, subservient to intelligent information systems that report their progress to unseen supervisors far away. Because computers measure quantity over quality, such systems tend to reward employees who work faster more than those who work better."
      },
      {
        label: "",
        text: "Service people on the telephone or at a cash register curtly terminate attempts at idle conversation because their performance is being electronically monitored. Once judged on their ability to troubleshoot unexpected situations, they're now evaluated by the number of transactions they complete in a shift or the number of keystrokes required to process a query. In the new 'electronic sweatshops', the computers are running the people, not the other way around."
      },
      {
        label: "",
        text: "'I think people are going to feel an increased fragmentation of self. They won't be able to hold the pieces together,' human resources consultant Philip Nicholson says. 'How do you keep a coherent space if you're going in and out of spaces that don't exist?' He likens the psychic numbing of electronic information overload to symptoms of post-traumatic stress syndrome (a mental disorder following a horrific event). In office 'wars', people become overwhelmed by the sheer amount of information available, internalise the diversity of the world outside, and fear losing control of their own lives."
      },
      {
        label: "",
        text: "If we are to survive the challenges of information-driven, hardwired offices, says Nicholson, we need to provide psychological support systems. As no one has yet measured the social cost of the workplace revolution, some psychologists are mobilising efforts to pool information as it is derived. Nicholson started the Technostress International Information Network in Massachusetts to foster an exchange of data and ideas on the effects of computerisation and information technology. Meanwhile, Brod wants to examine the parallels between electronic work environments and 'sealed-cabin ecologies' like space capsules or submarines, both totally automated artificial worlds in which people live in highly confined circumstances surrounded by technology that dictates the tenor of their days as well as their survival. He is petitioning other psychologists to convince the American Psychological Association to form a specialised study group."
      },
      {
        label: "",
        text: "In addition, Brod suggests that we re-examine our value systems and that we make greater allowances for privacy in order to circumvent potential revolts against technology. 'We need to coevolve with technology,' he says. 'These are wonderful tools, but if we exploit them without imposing appropriate values on their use, they become alienating and dangerous.'"
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 27–29. Complete each sentence with the correct ending, A–E, below. Write the correct letter, A–E, in boxes 27–29 on your answer sheet.",
        questions: [
          {
            id: "q27",
            number: 27,
            type: "multiple-choice",
            prompt: "The speed of technological changes",
            options: [
              { key: "A", text: "requires more detailed study by psychologists." },
              { key: "B", text: "means people have no time to challenge the significance of the new technology." },
              { key: "C", text: "may reduce inventiveness and innovation." },
              { key: "D", text: "suggests computers will take over the workplace." },
              { key: "E", text: "results from increased electronic supervision." }
            ],
            answer: "B",
            explanation: "The first paragraph states 'Most of us are too busy struggling to keep pace with ongoing innovations to question the implications of our new electronic authority figures.'"
          },
          {
            id: "q28",
            number: 28,
            type: "multiple-choice",
            prompt: "A dependency on technology and computers",
            options: [
              { key: "A", text: "requires more detailed study by psychologists." },
              { key: "B", text: "means people have no time to challenge the significance of the new technology." },
              { key: "C", text: "may reduce inventiveness and innovation." },
              { key: "D", text: "suggests computers will take over the workplace." },
              { key: "E", text: "results from increased electronic supervision." }
            ],
            answer: "C",
            explanation: "Brod warns that over-reliance on electronic tools could have serious repercussions on our ability to think creatively and develop new ideas."
          },
          {
            id: "q29",
            number: 29,
            type: "multiple-choice",
            prompt: "A deterioration in personal service",
            options: [
              { key: "A", text: "requires more detailed study by psychologists." },
              { key: "B", text: "means people have no time to challenge the significance of the new technology." },
              { key: "C", text: "may reduce inventiveness and innovation." },
              { key: "D", text: "suggests computers will take over the workplace." },
              { key: "E", text: "results from increased electronic supervision." }
            ],
            answer: "E",
            explanation: "The passage describes how service people curtly terminate conversation because their performance is being electronically monitored."
          }
        ]
      },
      {
        instructions: "Questions 30–35. Look at the following statements and the list of people below. Match each statement with the correct person or people, A, B, C or D. Write the correct letter, A, B, C or D, in boxes 30–35 on your answer sheet. NB You may use any letter more than once.",
        questions: [
          {
            id: "q30",
            number: 30,
            type: "multiple-choice",
            prompt: "Technology has placed greater expectations on workers not to make mistakes.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "B",
            explanation: "Daniel Dennett points out that modern technology eliminates the possibility of unavoidable ignorance, making the obligation to make accurate predictions more onerous."
          },
          {
            id: "q31",
            number: 31,
            type: "multiple-choice",
            prompt: "People will need time away from technology to reduce the frustrations caused by it.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "A",
            explanation: "Craig Brod says people 'need complete isolation to recover from the effects of the technology' when they leave the office."
          },
          {
            id: "q32",
            number: 32,
            type: "multiple-choice",
            prompt: "Interacting with others at work contributes to creative thinking.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "A",
            explanation: "Brod points out 'we need to avoid the temptation to replace informal gatherings for bouncing ideas off colleagues with electronic networking'."
          },
          {
            id: "q33",
            number: 33,
            type: "multiple-choice",
            prompt: "The psychological effect of working with technology is similar to the anxiety felt after surviving a major ordeal.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "D",
            explanation: "Philip Nicholson likens the psychic numbing of electronic information overload to symptoms of post-traumatic stress syndrome."
          },
          {
            id: "q34",
            number: 34,
            type: "multiple-choice",
            prompt: "Technology will ultimately increase unemployment for more highly qualified personnel.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "C",
            explanation: "Boyett and Conn describe a future in which millions of people charged with analysing information will be replaced by less skilled workers using intelligent software."
          },
          {
            id: "q35",
            number: 35,
            type: "multiple-choice",
            prompt: "More counselling is required to help people cope with the demands of the modern workplace.",
            options: [
              { key: "A", text: "Craig Brod" },
              { key: "B", text: "Daniel Dennett" },
              { key: "C", text: "Joseph Boyett and Henry Conn" },
              { key: "D", text: "Philip Nicholson" }
            ],
            answer: "D",
            explanation: "Nicholson states 'we need to provide psychological support systems' and started the Technostress International Information Network."
          }
        ]
      },
      {
        instructions: "Questions 36–40. Do the following statements agree with the information given in Reading Passage 3? In boxes 36–40, write: TRUE if the statement agrees, FALSE if the statement contradicts, NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q36",
            number: 36,
            type: "true-false-not-given",
            prompt: "Our knowledge of the effects of technology on workers is still limited.",
            answer: "TRUE",
            explanation: "The passage states 'Mass exposure to technological innovations in the workplace has come too recently for psychologists to reach a consensus on its societal implications.'"
          },
          {
            id: "q37",
            number: 37,
            type: "true-false-not-given",
            prompt: "An early indicator of technological anxiety is a tendency to adopt machine-like thinking.",
            answer: "TRUE",
            explanation: "Brod says one of the first signs is 'technostress, a cognitive shift that results from an over-identification with information systems' and that people internalise the patterns of electronic tools."
          },
          {
            id: "q38",
            number: 38,
            type: "true-false-not-given",
            prompt: "We have now started to doubt our ability to perform well at work.",
            answer: "TRUE",
            explanation: "Dennett points out that it becomes 'increasingly difficult to convince ourselves that we're doing an adequate job'."
          },
          {
            id: "q39",
            number: 39,
            type: "true-false-not-given",
            prompt: "Top level managers may be more negatively affected by changes in the electronic workplace than junior workers.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions that for executives the benefits may outweigh disadvantages, but does not compare their negative effects to those of junior workers."
          },
          {
            id: "q40",
            number: 40,
            type: "true-false-not-given",
            prompt: "Employees who learn to use new technology quickly will get promoted.",
            answer: "NOT GIVEN",
            explanation: "The passage does not mention promotions based on technology skills."
          }
        ]
      }
    ]
  },

  // TEST 7 - PASSAGE 1
  {
    slug: "answers-underground",
    title: "Answers Underground",
    subtitle: "Burying greenhouse gases to slow global warming",
    paragraphs: [
      {
        label: "A",
        text: "One way to slow global warming is to take the greenhouse gases that cause it and bury them. That is the idea behind projects now under way to capture emissions from power plants and factories and force them underground or deep into the ocean. There, proponents argue, they could be trapped for thousands of years. This concept, known as carbon sequestration, is already being used by oil companies to improve the efficiency of oil wells, and now engineers have begun exploring ways to capture carbon dioxide emissions from power plants to reduce their impact on the environment. At a recent conference, delegates from fourteen industrialised and developing countries agreed to engage in cooperative research into capturing and storing carbon dioxide. The goal is to stabilise emissions of greenhouse gases that trap heat in the atmosphere."
      },
      {
        label: "B",
        text: "Over the past century, airborne carbon dioxide concentrations have risen by nearly a third, according to Scott Klara, sequestration manager at the US National Energy Technology Laboratory. Unless emissions are slashed by two thirds worldwide, the Intergovernmental Panel on Climate Change predicts that concentrations will rise to double the levels of the early 1700s, before the Industrial Revolution."
      },
      {
        label: "C",
        text: "These increased levels of carbon-based compounds in the atmosphere are believed to be the cause of rising temperatures and sea levels around the world. Ignoring the problem is therefore not an option."
      },
      {
        label: "D",
        text: "Limiting emissions, however, is not an easy undertaking since increased energy consumption is a key to economic growth. Two thirds of the world's power-generating capacity, expected to come into use by 2030, has not been constructed yet, according to the International Energy Agency. The developing world will be particularly important. China and India alone are expected to account for two thirds of the global increase in coal usage over the next fifteen years."
      },
      {
        label: "E",
        text: "Solutions are being sought. Work is being undertaken with alternatives to fossil fuels such as wind and solar energy, but it will be a long time before these alternative sources play a major role in fulfilling the world's energy needs. Geophysicist Klaus Lackner points out that around 85% of the world's energy is derived from fossil fuels, the cheapest and most plentiful energy source available, and the developing world in particular is unlikely to give them up. That is why many scientists support sequestration."
      },
      {
        label: "F",
        text: "However, several problems must be resolved before sequestration plays a key role in a low-carbon future. One is the cost of capturing carbon dioxide. A second is storing the gas safely once it's been captured. Today, it costs about $US50 to extract and store a tonne of carbon dioxide from a power plant, which raises the cost of producing electricity by 30-80%. Lackner argues that it is too expensive to adapt existing plants to capture carbon dioxide. Instead, he recommends that carbon-capturing capacity be built into future plants. Economic incentives are needed to encourage companies to identify low-cost carbon-sequestration solutions. A government-supported program in the US has enabled some factories to partially capture carbon emissions, which they then sell for various uses, including carbonating soft drinks. However, there are no power plants ready for full carbon capture."
      },
      {
        label: "G",
        text: "Once the carbon has been captured it must be stored. Natural carbon sinks, such as forests and wetlands, can remove some carbon dioxide from the atmosphere, but not nearly enough. Carbon dioxide could be pumped to the bottom of the ocean, where the pressure would keep it pinned to the seabed in liquid form for decades, but that has serious long-term environmental risks. David Hawkins, from the Natural Resources Defense Council in Washington, warns that the carbon dioxide could radically alter the chemical balance in the ocean, with potentially harmful consequences for marine life. Others worry that the carbon dioxide could escape back into the atmosphere."
      },
      {
        label: "H",
        text: "A few promising attempts at underground carbon sequestration are currently under way. In western Canada, an oil company is pumping liquefied carbon dioxide into oil wells to force more oil to the surface and boost recovery by 10-15%. The company gets the carbon dioxide via a pipeline from North Dakota in the US, where the gas is captured from a synthetic-fuel plant. In another instance in the North Sea, a Norwegian energy firm is injecting carbon dioxide waste from its natural-gas operations into a saline aquifer 1,000 metres beneath the ocean floor."
      },
      {
        label: "I",
        text: "Clearly, storing large amounts of gas underground raises environmental fears. Environmentalists argue that more research is needed on potential storage sites, such as oil and gas reservoirs and coal seams unsuitable for mining, to ensure that they offer long-term solutions. The World Wide Fund for Nature Australia has argued that the primary risk of underground storage is that dangerously large volumes of carbon dioxide might escape and people become asphyxiated."
      },
      {
        label: "J",
        text: "Little progress in slashing global greenhouse gases can be achieved without involving developing countries, but for now carbon sequestration is not their priority because of the increased costs this would add to energy production. Hawkins argues that, to encourage developing nations to use sequestration, developed nations will have to provide assistance. He suggests a multilateral initiative in which developed nations, perhaps by purchasing carbon credits from poorer countries, finance the difference between the cost of a regular coal-fired power plant and one that captures carbon emissions. That is, the rich - who will remain the world's biggest polluters for years to come - would buy the right to emit carbon from the poor, who would use the proceeds to build better plants."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 1–6. Look at the following issues (Questions 1-6) and the list of people and organisations below. Match each issue with the correct person or organization, A-F. Write the correct letter, A-F, in boxes 1-6. NB You may use any letter more than once.",
        questions: [
          {
            id: "q1",
            number: 1,
            type: "multiple-choice",
            prompt: "The cost implications of fitting plants with the necessary equipment.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "D",
            explanation: "Paragraph F discusses the cost of capturing carbon dioxide and Lackner argues it is too expensive to adapt existing plants."
          },
          {
            id: "q2",
            number: 2,
            type: "multiple-choice",
            prompt: "The effects of sequestration could have on sea creatures.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "E",
            explanation: "Paragraph G states David Hawkins warns that carbon dioxide could have harmful consequences for marine life."
          },
          {
            id: "q3",
            number: 3,
            type: "multiple-choice",
            prompt: "The reasons why products such as oil and gas continue to be popular energy sources.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "D",
            explanation: "Paragraph E states Lackner points out that fossil fuels are 'the cheapest and most plentiful energy source available'."
          },
          {
            id: "q4",
            number: 4,
            type: "multiple-choice",
            prompt: "The need for industrialised countries to give aid to less wealthy countries.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "E",
            explanation: "Paragraph J states Hawkins argues that developed nations will have to provide assistance to encourage developing nations to use sequestration."
          },
          {
            id: "q5",
            number: 5,
            type: "multiple-choice",
            prompt: "The significant increase in carbon dioxide concentrations in the air over the last 100 years.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "A",
            explanation: "Paragraph B states Scott Klara reports that airborne carbon dioxide concentrations have risen by nearly a third over the past century."
          },
          {
            id: "q6",
            number: 6,
            type: "multiple-choice",
            prompt: "The potential for sequestration to harm human life.",
            options: [
              { key: "A", text: "Scott Klara" },
              { key: "B", text: "Intergovernmental Panel on Climate Change" },
              { key: "C", text: "International Energy Agency" },
              { key: "D", text: "Klaus Lackner" },
              { key: "E", text: "David Hawkins" },
              { key: "F", text: "World Wide Fund for Nature Australia" }
            ],
            answer: "F",
            explanation: "Paragraph I states the World Wide Fund for Nature Australia argues that the primary risk is that people might become asphyxiated."
          }
        ]
      },
      {
        instructions: "Questions 7–9. Reading Passage 1 has ten paragraphs, A–J. Which paragraph contains the following information? Write the correct letter, A–J, in boxes 7-9.",
        questions: [
          {
            id: "q7",
            number: 7,
            type: "matching-headings",
            prompt: "Examples of sequestration already in use in several parts of the world",
            paragraphLabel: "Paragraph",
            answer: "H",
            explanation: "Paragraph H describes specific examples of underground carbon sequestration in Canada and the North Sea."
          },
          {
            id: "q8",
            number: 8,
            type: "matching-headings",
            prompt: "An example of putting carbon dioxide emissions to use in the food and beverage industry",
            paragraphLabel: "Paragraph",
            answer: "F",
            explanation: "Paragraph F mentions that captured carbon emissions are sold for various uses, including carbonating soft drinks."
          },
          {
            id: "q9",
            number: 9,
            type: "matching-headings",
            prompt: "Current examples of the environmental harm attributed to carbon dioxide in the air",
            paragraphLabel: "Paragraph",
            answer: "C",
            explanation: "Paragraph C states that increased levels of carbon-based compounds are believed to be the cause of rising temperatures and sea levels."
          }
        ]
      },
      {
        instructions: "Questions 10–13. Do the following statements agree with the information given in Reading Passage 1? In boxes 10–13, write: TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q10",
            number: 10,
            type: "true-false-not-given",
            prompt: "Both developing and developed nations have decided to investigate carbon dioxide sequestration.",
            answer: "TRUE",
            explanation: "Paragraph A states that delegates from fourteen industrialised and developing countries agreed to engage in cooperative research into capturing and storing carbon dioxide."
          },
          {
            id: "q11",
            number: 11,
            type: "true-false-not-given",
            prompt: "A growing economy will use more power.",
            answer: "TRUE",
            explanation: "Paragraph D states 'increased energy consumption is a key to economic growth'."
          },
          {
            id: "q12",
            number: 12,
            type: "true-false-not-given",
            prompt: "Capturing carbon dioxide has become financially attractive.",
            answer: "FALSE",
            explanation: "Paragraph F states it costs about $US50 to extract and store a tonne and raises electricity costs by 30-80%, and Lackner argues it is too expensive."
          },
          {
            id: "q13",
            number: 13,
            type: "true-false-not-given",
            prompt: "More forests need to be planted to improve the atmosphere.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions forests as natural carbon sinks but does not state that more forests need to be planted."
          }
        ]
      }
    ]
  },

  // TEST 7 - PASSAGE 2
  {
    slug: "science-and-the-stradivarius",
    title: "Science and the Stradivarius: Uncovering the secret of quality",
    subtitle: "",
    headingBank: [
      { id: "i", text: "An analysis of protective coatings" },
      { id: "ii", text: "Applying technology to violin production" },
      { id: "iii", text: "Location a key factor" },
      { id: "iv", text: "A controversial range of prices" },
      { id: "v", text: "Techniques of mass production" },
      { id: "vi", text: "The advantages of older wood" },
      { id: "vii", text: "A re-evaluation of documentary evidence" },
      { id: "viii", text: "The mathematical basis of earlier design" },
      { id: "ix", text: "Manual woodworking techniques" },
      { id: "x", text: "Preferences of top musicians" },
      { id: "xi", text: "The use of saturated wood" },
      { id: "xii", text: "The challenge for scientists" }
    ],
    paragraphs: [
      {
        label: "A",
        text: "Violins made by long-dead Italian craftsmen from the Cremona region are beautiful works of art, coveted by collectors as well as players. Particularly outstanding violins have reputedly changed hands for over a million pounds. In contrast, fine modern instruments can be bought for under £100. Do such figures really reflect such large differences in quality? After more than a hundred years of vigorous debate, this question remains highly contentious, provoking strongly held but divergent views among musicians, violin makers and scientists alike."
      },
      {
        label: "B",
        text: "Every violin, whether a Stradivarius or the cheapest factory-made copy, has a distinctive 'voice' of its own. Just as any musician can immediately recognise the difference between Domingo and Pavarotti singing the same operatic aria, so a skilled violinist can distinguish between different qualities in the sound produced by individual Stradivari or Guarneri violins. Individual notes on a single instrument sound different each time they are played, which suggests that the perceived tone of a violin must be related to the overall design of the instrument, rather than the frequencies of particular resonances on it. But although various attempts have been made to analyse such global properties, it is extremely difficult to distinguish between a fine Stradivarius instrument and an indifferent modern copy on the basis of the measured response alone."
      },
      {
        label: "C",
        text: "The ear is a supreme detection device, and a system has yet to be developed which can match the brain's sophisticated ability to assess complex sounds. So how do skilled violinmakers optimise the tone of an instrument during the construction process? They begin by selecting a wood of the highest possible quality for the front and back plates (or parts of the violin), which they test by tapping with a hammer and judging how well it 'rings'. The next important step is to skillfully carve the plates out of the solid wood, taking great care to get the right degree of arching and variations in thickness. Traditional makers optimise the thickness by testing the 'feel' of the plates when they are flexed, and by the sounds produced when they are tapped at different positions with the knuckles."
      },
      {
        label: "D",
        text: "However, in the last 50 years or so a group of violin makers has emerged who have tried to take a more overtly scientific approach to violin making. One common practice they have adopted is to replace the traditional flexing and tapping of plates by controlled measurements. During the carving process, the thinned plates are sprinkled with flakes of glitter and suspended horizontally above a loudspeaker. The glitter forms a pattern each time the loudspeaker excites a resonance. The aim is to interactively 'tune' these first few free plate resonances to specified patterns."
      },
      {
        label: "E",
        text: "Unfortunately, there are very few examples of such measurements for really fine Italian instruments because their owners are naturally reluctant to allow their violins to be taken apart for the sake of science. The few tests that have been performed suggest that the first Italian makers may have tuned the resonant modes of the individual plates - which they could identify as they tapped them to exact musical intervals. This would be consistent with the prevailing Renaissance view of 'perfection', which was measured in terms of numbers and exact ratios. However, there is no historical data to support this case."
      },
      {
        label: "F",
        text: "Another factor that affects sound quality is the presence of moisture. To achieve the quality of \"vibrancy\" in a violin requires high-quality wood with low internal damping. By measuring the pattern of growth-rings in the wood of a Stradivarius, we know that the Italian violin makers sometimes used planks of wood that had only been seasoned for five years. However, such wood is now 300 years old, and the intrinsic internal damping will almost certainly have decreased with time. The age of the wood may therefore automatically contribute to the improved quality of older instruments. This may also explain why the quality of a modern instrument appears to improve in its first few years."
      },
      {
        label: "G",
        text: "Another factor thought to account for sound quality is the nature of the varnish used to protect the instrument. One of the most popular theories for well over a century to account for the Stradivarius secret has been that the varnish had some sort of 'magic' composition. However, historical research has shown that it was very similar to the varnish used today. So apart from the possibility that the Italian varnish was contaminated with the wings of passing insects and debris from the workshop floor, there is no convincing evidence to support the idea of a secret formula."
      },
      {
        label: "H",
        text: "Other researchers, meanwhile, have claimed that Stradivarius's secret was to soak the timber in water, to leach out supposedly harmful chemicals, before it was seasoned. Although this would be consistent with the idea that the masts and oars of recently sunken Venetian war galleys might have been used to make violins, other scientific and historical evidence to support this view is unconvincing."
      },
      {
        label: "I",
        text: "In conclusion, science has not provided any convincing evidence to set Cremonese instruments apart from the finest violins made by skilled craftsmen today. Indeed, some leading soloists do occasionally play on modern instruments. However, the foremost soloists - and, not surprisingly, violin dealers, who have a vested interest in maintaining the Cremonese legend of intrinsic superiority - remain utterly unconvinced."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 14–21. Reading Passage 2 has nine paragraphs, A–I. Choose the correct heading for paragraphs A and C–I from the list of headings below. Write the correct number, i–xii, in boxes 14–21.",
        questions: [
          {
            id: "q14",
            number: 14,
            type: "matching-headings",
            prompt: "Paragraph A",
            paragraphLabel: "Paragraph A",
            answer: "iv",
            explanation: "Paragraph A discusses the large price differences between Stradivarius violins and modern instruments, which is controversial."
          },
          {
            id: "q15",
            number: 15,
            type: "matching-headings",
            prompt: "Paragraph C",
            paragraphLabel: "Paragraph C",
            answer: "ix",
            explanation: "Paragraph C describes traditional manual woodworking techniques used by violin makers."
          },
          {
            id: "q16",
            number: 16,
            type: "matching-headings",
            prompt: "Paragraph D",
            paragraphLabel: "Paragraph D",
            answer: "ii",
            explanation: "Paragraph D describes applying scientific technology to violin production with measurements and loudspeakers."
          },
          {
            id: "q17",
            number: 17,
            type: "matching-headings",
            prompt: "Paragraph E",
            paragraphLabel: "Paragraph E",
            answer: "viii",
            explanation: "Paragraph E mentions the Renaissance view of perfection measured in numbers and exact ratios, suggesting a mathematical basis."
          },
          {
            id: "q18",
            number: 18,
            type: "matching-headings",
            prompt: "Paragraph F",
            paragraphLabel: "Paragraph F",
            answer: "vi",
            explanation: "Paragraph F discusses how the age of wood contributes to improved quality, an advantage of older wood."
          },
          {
            id: "q19",
            number: 19,
            type: "matching-headings",
            prompt: "Paragraph G",
            paragraphLabel: "Paragraph G",
            answer: "i",
            explanation: "Paragraph G discusses the varnish used to protect the instrument, which is a protective coating."
          },
          {
            id: "q20",
            number: 20,
            type: "matching-headings",
            prompt: "Paragraph H",
            paragraphLabel: "Paragraph H",
            answer: "xi",
            explanation: "Paragraph H discusses soaking timber in water to leach out chemicals, which relates to the use of saturated wood."
          },
          {
            id: "q21",
            number: 21,
            type: "matching-headings",
            prompt: "Paragraph I",
            paragraphLabel: "Paragraph I",
            answer: "x",
            explanation: "Paragraph I mentions that some leading soloists play modern instruments but foremost soloists remain unconvinced, discussing preferences."
          }
        ]
      },
      {
        instructions: "Questions 22–26. Do the following statements agree with the information given in Reading Passage 2? In boxes 22–26, write: TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q22",
            number: 22,
            type: "true-false-not-given",
            prompt: "The quality of any particular note played on the same violin varies.",
            answer: "TRUE",
            explanation: "Paragraph B states 'Individual notes on a single instrument sound different each time they are played'."
          },
          {
            id: "q23",
            number: 23,
            type: "true-false-not-given",
            prompt: "Scientific instruments analyse complex sound more accurately than humans.",
            answer: "FALSE",
            explanation: "Paragraph C states 'The ear is a supreme detection device, and a system has yet to be developed which can match the brain's sophisticated ability to assess complex sounds.'"
          },
          {
            id: "q24",
            number: 24,
            type: "true-false-not-given",
            prompt: "The quality of handmade violins varies according to the musical ability of the craftsman.",
            answer: "NOT GIVEN",
            explanation: "The passage does not mention the musical ability of the craftsman affecting violin quality."
          },
          {
            id: "q25",
            number: 25,
            type: "true-false-not-given",
            prompt: "Modern violins seem to improve in their early years.",
            answer: "TRUE",
            explanation: "Paragraph F states 'This may also explain why the quality of a modern instrument appears to improve in its first few years.'"
          },
          {
            id: "q26",
            number: 26,
            type: "true-false-not-given",
            prompt: "Modern violins are gaining in popularity amongst the top violinists",
            answer: "FALSE",
            explanation: "Paragraph I states that the foremost soloists 'remain utterly unconvinced' about modern instruments."
          }
        ]
      }
    ]
  },

  // TEST 7 - PASSAGE 3
  {
    slug: "when-people-are-deaf-to-music",
    title: "When people are deaf to music",
    subtitle: "",
    paragraphs: [
      {
        label: "",
        text: "Music has long been considered a uniquely human concept. In fact, most psychologists agree that music is a universal human instinct. Like any ability, however, there is great variation in people's musical competence. For every brilliant pianist in the world, there are several people we refer to as \"tone deaf\". It is not simply that people with tone deafness (or \"amusia\") are unable to sing in tune, they are also unable to discriminate between tones or recognize familiar melodies. Such a \"disorder\" can occur after some sort of brain damage, but recently research has been undertaken in an attempt to discover the cause of congenital amusia (when people are born with the condition), which is not associated with any brain damage, hearing problems, or lack of exposure to music."
      },
      {
        label: "",
        text: "According to the research of Dr. Isabelle Peretz of the University of Montreal, amusia is more complicated than the inability to distinguish pitches. An amusia (a person who has the condition of amusia) can distinguish between two pitches that are far apart, but cannot tell the difference between intervals smaller than a half step on the Western diatonic scale, while most people can easily distinguish differences smaller than that. When listening to melodies which have had a single note altered so that it is out of key with the rest of the melody, do not notice a problem. As would be expected, amusics perform significantly worse at singing and tapping a rhythm along with a melody than do non-amusics."
      },
      {
        label: "",
        text: "The most fascinating aspect of amusia is how specific to music it is. Because of music's close ties to language, it might be expected that a musical impairment may be caused by a language impairment. Studies suggest, however, that language and music ability are independent of one another. People with brain damage in areas critical to language are often still able to sing, despite being unable to communicate through speech. Moreover, while amusics show deficiencies in their recognition of pitch differences in melodies, they show no tonal languages, such as Chinese, do not report having any difficulty discriminating between words that differ only in their intonation. The linguistic cues inherent in speech make discrimination of meaning much easier for amusics. Amusics are also successful most of the time at detecting the mood of a melody, can identify a speaker based on his or her voice and can discriminate and identify environmental sounds."
      },
      {
        label: "",
        text: "Recent work has been focused on locating the part of the brain that is responsible for amusia. The temporal lobes of the brain, the location of the primary auditory cortex, have been considered. It has long been believed that the temporal lobes, especially the right temporal lobe, are most active when activity, so any musical disability should logically stem from here as well. Because it has been shown that there is no hearing deficit in amusia, researchers moved on to the temporal neocortex, which is where more sophisticated processing of musical cues was thought to take place. New studies, however, have suggested that the deficits in amusics are located outside the auditory cortex. Brain scans of amusics do not show any reaction at all to differences smaller than a half step. When changes in tones are large, their brains overreact, showing twice as much activity on the right side of the brain as a normal brain hearing the same thing. These differences do not occur in the auditory cortex, indicating again that the deficits of amusia lie mostly in hearing impairment, but in higher processing of melodies."
      },
      {
        label: "",
        text: "So what does this all mean? Looking only at the research of Peretz in the field of neuropsychology of music, it would appear that amusia is some sort of disorder. As a student of neurobiology, however, I am skeptical. Certainly the studies by Peretz that have found significant differences between the brains of so-called amusics and normal brains are legitimate. The more important question now becomes one of normality. Every trait from skin color to intelligence to mood exists on a continuum-there is a great idea of variation from one extreme to the other. Just because we recognize that basic musical ability is something that the vast majority of people have, this doesn't mean that the lack of it is abnormal."
      },
      {
        label: "",
        text: "What makes an amusic worse off than a musical prodigy? Musical ability is culturally valued, and may have been a factor in survival at one point in human history, but it does not seem likely that it is being selected for on an evolutionary scale any longer. Darwin believed that music was adaptive as a way of finding a mate, but who needs to be able to sing to find a partner in an age when it is possible to express your emotions through a song on your IPod? While the idea of amusia is interesting, it seems to be just one end of the continuum of innate musical ability. Comparing this 'disorder' to learning disorders like a specific language impairment seems to be going too far. Before, amusia can be declared a disability, further research must be done to determine whether lack of musical ability is actually detrimental in any way. If no disadvantages can be found of having amusia, then it is no more a disability than having poor fashion sense or bad handwriting."
      }
    ],
    questionGroups: [
      {
        instructions: "Questions 27–31. Choose the correct letter, A, B, C or D.",
        questions: [
          {
            id: "q27",
            number: 27,
            type: "multiple-choice",
            prompt: "What does the writer tell us about people with tone deafness (amusia) in the first paragraph?",
            options: [
              { key: "A", text: "They usually have hearing problems" },
              { key: "B", text: "Some can play a musical instrument very well" },
              { key: "C", text: "Some may be able to sing well-known melodies" },
              { key: "D", text: "They have several inabilities in regard to music" }
            ],
            answer: "D",
            explanation: "The first paragraph states that amusics 'are unable to sing in tune, they are also unable to discriminate between tones or recognize familiar melodies'."
          },
          {
            id: "q28",
            number: 28,
            type: "multiple-choice",
            prompt: "What is the writer doing in the second paragraph?",
            options: [
              { key: "A", text: "outlining some of factors that cause amusia" },
              { key: "B", text: "summarising some findings about people with amusia" },
              { key: "C", text: "suggesting that people with amusia are disadvantaged" },
              { key: "D", text: "comparing the sing ability of amusia with their sense" }
            ],
            answer: "B",
            explanation: "The second paragraph summarizes Dr. Peretz's research findings about what amusics can and cannot do."
          },
          {
            id: "q29",
            number: 29,
            type: "multiple-choice",
            prompt: "What does the writer say about the relationship between language ability and musical ability?",
            options: [
              { key: "A", text: "People who are unable to speak can sometimes sing" },
              { key: "B", text: "People with amusia usually have language problems too" },
              { key: "C", text: "Speakers of tonal languages like Chinese rarely have amusia" },
              { key: "D", text: "People with amusia have difficulty recognizing people by their voices" }
            ],
            answer: "A",
            explanation: "Paragraph 3 states 'People with brain damage in areas critical to language are often still able to sing, despite being unable to communicate through speech.'"
          },
          {
            id: "q30",
            number: 30,
            type: "multiple-choice",
            prompt: "In the third paragraph, the writer notes that most amusics are able to",
            options: [
              { key: "A", text: "learn how to sing in tune" },
              { key: "B", text: "identify a song by its tune" },
              { key: "C", text: "distinguish a sad tone from a happy tune" },
              { key: "D", text: "recognise when a singer is not sing in tune" }
            ],
            answer: "C",
            explanation: "Paragraph 3 states 'Amusics are also successful most of the time at detecting the mood of a melody'."
          },
          {
            id: "q31",
            number: 31,
            type: "multiple-choice",
            prompt: "What is the writer doing in the fourth paragraph?",
            options: [
              { key: "A", text: "claiming that amusics have problems in the auditory cortex" },
              { key: "B", text: "outlining progress in understanding the brains of amusics" },
              { key: "C", text: "proving that amuisa is located in the temporal lobes" },
              { key: "D", text: "explaining why studies of hearing are difficult" }
            ],
            answer: "B",
            explanation: "Paragraph 4 describes how research has moved from the temporal lobes to the temporal neocortex and now suggests deficits are outside the auditory cortex."
          }
        ]
      },
      {
        instructions: "Questions 32–35. Do the following statements agree with the views of the writer in Reading Passage 3? In boxes 32–35, write: YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
        questions: [
          {
            id: "q32",
            number: 32,
            type: "yes-no-not-given",
            prompt: "Peretz's research suggesting that amusia is a disorder is convincing.",
            answer: "NO",
            explanation: "Paragraph 5 states 'As a student of neurobiology, however, I am skeptical' about Peretz's research."
          },
          {
            id: "q33",
            number: 33,
            type: "yes-no-not-given",
            prompt: "People with musical ability are happier than those without this ability.",
            answer: "NOT GIVEN",
            explanation: "The passage does not mention happiness in relation to musical ability."
          },
          {
            id: "q34",
            number: 34,
            type: "yes-no-not-given",
            prompt: "It is inappropriate to consider amusia as real disorder.",
            answer: "YES",
            explanation: "Paragraph 6 states 'Comparing this \"disorder\" to learning disorders like a specific language impairment seems to be going too far' and questions whether it should be considered a disability."
          },
          {
            id: "q35",
            number: 35,
            type: "yes-no-not-given",
            prompt: "People with amusia often have bad handwriting.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions bad handwriting only as an analogy, not as a characteristic of amusics."
          }
        ]
      },
      {
        instructions: "Questions 36–40. Complete each sentence with the correct ending, A-H below. Write the correct letter, A-H in boxes 36-40.",
        questions: [
          {
            id: "q36",
            number: 36,
            type: "multiple-choice",
            prompt: "The reason why some people are born with amusia is",
            options: [
              { key: "A", text: "an inability to hear when spoken language rises and falls." },
              { key: "B", text: "considered to be desirable." },
              { key: "C", text: "an inability to follow the beat of music." },
              { key: "D", text: "not a problem." },
              { key: "E", text: "not yet well understood." },
              { key: "F", text: "a result of injury to the mother." },
              { key: "G", text: "more marked that with other people." },
              { key: "H", text: "associated with intelligence." }
            ],
            answer: "E",
            explanation: "The first paragraph states research has been undertaken to discover the cause of congenital amusia, but doesn't provide a definitive reason."
          },
          {
            id: "q37",
            number: 37,
            type: "multiple-choice",
            prompt: "One of the difficulties amusia experience is",
            options: [
              { key: "A", text: "an inability to hear when spoken language rises and falls." },
              { key: "B", text: "considered to be desirable." },
              { key: "C", text: "an inability to follow the beat of music." },
              { key: "D", text: "not a problem." },
              { key: "E", text: "not yet well understood." },
              { key: "F", text: "a result of injury to the mother." },
              { key: "G", text: "more marked that with other people." },
              { key: "H", text: "associated with intelligence." }
            ],
            answer: "C",
            explanation: "Paragraph 2 states amusics perform significantly worse at 'tapping a rhythm along with a melody'."
          },
          {
            id: "q38",
            number: 38,
            type: "multiple-choice",
            prompt: "For amusia, discrimination of meaning in speech is",
            options: [
              { key: "A", text: "an inability to hear when spoken language rises and falls." },
              { key: "B", text: "considered to be desirable." },
              { key: "C", text: "an inability to follow the beat of music." },
              { key: "D", text: "not a problem." },
              { key: "E", text: "not yet well understood." },
              { key: "F", text: "a result of injury to the mother." },
              { key: "G", text: "more marked that with other people." },
              { key: "H", text: "associated with intelligence." }
            ],
            answer: "D",
            explanation: "Paragraph 3 states 'The linguistic cues inherent in speech make discrimination of meaning much easier for amusics.'"
          },
          {
            id: "q39",
            number: 39,
            type: "multiple-choice",
            prompt: "The brain activity of amusics when listening to music is",
            options: [
              { key: "A", text: "an inability to hear when spoken language rises and falls." },
              { key: "B", text: "considered to be desirable." },
              { key: "C", text: "an inability to follow the beat of music." },
              { key: "D", text: "not a problem." },
              { key: "E", text: "not yet well understood." },
              { key: "F", text: "a result of injury to the mother." },
              { key: "G", text: "more marked that with other people." },
              { key: "H", text: "associated with intelligence." }
            ],
            answer: "G",
            explanation: "Paragraph 4 states that when changes in tones are large, amusics' brains show 'twice as much activity on the right side of the brain as a normal brain'."
          },
          {
            id: "q40",
            number: 40,
            type: "multiple-choice",
            prompt: "The writer's attitude to amusia is that it is",
            options: [
              { key: "A", text: "an inability to hear when spoken language rises and falls." },
              { key: "B", text: "considered to be desirable." },
              { key: "C", text: "an inability to follow the beat of music." },
              { key: "D", text: "not a problem." },
              { key: "E", text: "not yet well understood." },
              { key: "F", text: "a result of injury to the mother." },
              { key: "G", text: "more marked that with other people." },
              { key: "H", text: "associated with intelligence." }
            ],
            answer: "B",
            explanation: "According to the answer key in the HTML source."
          }
        ]
      }
    ]
  }
];
