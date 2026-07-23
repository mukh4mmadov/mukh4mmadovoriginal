import { ReadingPassage } from "@/types/ielts";

// Authentic Cambridge IELTS Reading Passages extracted from provided HTML files
// These are genuine Cambridge IELTS Academic Reading passages with original questions and answers

export const cambridgePassages: ReadingPassage[] = [
  {
    slug: "the-rise-and-fall-of-detective-stories",
    title: "The rise and fall of detective stories",
    subtitle: "Detective stories became hugely popular in the 19th and 20th centuries. William D. Rubinstein looks at why social changes eventually led to their downfall",
    wordCount: 542,
    paragraphs: [
      {
        label: "",
        text: "The detective story is normally said to have begun in the fertile brain of the great American writer Edgar Allan Poe (1809-49), especially in his stories featuring the detective C. Auguste Dupin. From 1859, Dupin had a counterpart in Monsieur Lecoq, created by the French author Emile Gaboriau. Despite these American and French origins, it was to Britain that detective fiction migrated, where it took root and flourished, becoming a characteristically British genre."
      },
      {
        label: "",
        text: "This transition occurred because of one author and his great detective. The most famous of all fictional detectives, Sherlock Holmes, was introduced by Sir Arthur Conan Doyle in A Study in Scarlet, first published in 1887, and later became the subject of four novels and 56 short stories. Nearly all of the Holmes stories are narrated by his friend Dr Watson. Watson is constantly amazed and stupefied by Holmes' genius, but despite years of working with him, Watson is never able to produce these brilliant insights himself. Holmes is memorably eccentric, with a range of endearing and less endearing habits. He is a brilliant private detective, categorically better than the plodding and mediocre officials of Scotland Yard, who constantly turn to him when they are baffled. This in itself is pure fiction: in real life there were never any brilliant private detectives to whom Scotland Yard turned when they failed, and the Yard's Criminal Investigation Department (CID) had a remarkable clear-up rate and was highly competent."
      },
      {
        label: "",
        text: "Most of the Holmes stories are set among the higher levels of 19th-century British society, a world inhabited by professional men, retired army officers and country gentlemen, as well as members of royalty and cabinet ministers. Few take place among the working classes or the very poor, whereas in fact much crime was a product of the poverty and gangs in London's underworld."
      },
      {
        label: "",
        text: "In the 20th century detective stories became increasingly popular. Reading these stories was one of the characteristic aspects of the British middle classes in the 'golden age' of British detective fiction — the 1920s and 30s. Their emphasis on rationality, the inevitable triumph of justice, and the existence of an unofficial super-detective tells us much about the society of the time. So, too, do the stock characters and unstated prejudices in these works: country folk and domestic servants were almost always depicted as unintelligent, and women were often depicted in a simplistic, two-dimensional way, although a few female detective writers would present female characters in a more realistic manner."
      },
      {
        label: "",
        text: "Most of the well-known British authors of 'golden age' detective stories were drawn from the middle classes, like their audience. Conan Doyle was a doctor who turned to writing fiction while he awaited his patients; Freeman Wills Crofts was a railway engineer in Northern Ireland; Gilbert Keith Chesterton and Anthony Berkeley were journalists; Cecil Street a career army officer. Apart from a few superstars such as Agatha Christie, financial rewards for these interwar authors were rather meagre; a few hundred pounds per book — a useful income, but nothing princely."
      },
      {
        label: "",
        text: "US writers such as Rex Stout and Ellery Queen attempted to recreate the 'golden age' of British detective fiction. For the most part their books were mere imitations of the British models, although they were seldom wholly successful. But in the 1920s and 1930s, America also saw the rise of the 'hard-boiled' genre and its detective type: the tough private cop who appeared in the works of Dashiell Hammett and Raymond Chandler. Apart from the violence that appeared throughout their works, Hammett's and Chandler's novels were often marked by a political agenda that sought to expose the inequality they saw at the heart of American life. Britain had no real parallel either to their outlook on the world or (until much later) to their violence, but upheld the belief that the authorities should punish criminals regardless of their circumstances."
      },
      {
        label: "",
        text: "By around 1960, the classic British detective story was in serious decline. It seemed that writers had simply run out of ingenious plots and puzzles for their detectives to solve. The best-known crime fiction writers, such as P D James, eschewed private detectives for police inspectors, and straightforward puzzles for stories that were full of unexpected twists."
      },
      {
        label: "",
        text: "Today the detective story no longer exists in Britain, at least in its old form. Arguably this mirrors the transformation of that society as a whole. The belief that scientific developments were invariably beneficial possibly reached its height during the period when the classic detective story flourished, as did the belief in putting rationality at the heart of Britain's education system. And finally, the central belief that evil-doers would inevitably get their just deserts through the incorruptibility of the judicial system was replaced by a questioning of some of the procedures and decisions associated with that system."
      }
    ],
    questionGroups: [
      {
        instructions: "Do the following statements agree with the information given in Reading Passage 1? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
        questions: [
          {
            id: "q1",
            number: 1,
            type: "true-false-not-given",
            prompt: "C. Auguste Dupin and Emile Gaboriau were both writers of detective stories.",
            answer: "FALSE",
            explanation: "The passage states that Dupin was created by Edgar Allan Poe and Lecoq was created by Emile Gaboriau. Dupin and Lecoq are fictional detectives, not writers. Poe and Gaboriau were the writers.",
            evidence: "The detective story is normally said to have begun in the fertile brain of the great American writer Edgar Allan Poe (1809-49), especially in his stories featuring the detective C. Auguste Dupin. From 1859, Dupin had a counterpart in Monsieur Lecoq, created by the French author Emile Gaboriau."
          },
          {
            id: "q2",
            number: 2,
            type: "true-false-not-given",
            prompt: "It was Conan Doyle's creation of Sherlock Holmes that made the detective story a typically British genre.",
            answer: "TRUE",
            explanation: "The passage states that 'it was to Britain that detective fiction migrated, where it took root and flourished, becoming a characteristically British genre' and that 'This transition occurred because of one author and his great detective' referring to Conan Doyle and Sherlock Holmes.",
            evidence: "This transition occurred because of one author and his great detective. The most famous of all fictional detectives, Sherlock Holmes, was introduced by Sir Arthur Conan Doyle"
          },
          {
            id: "q3",
            number: 3,
            type: "true-false-not-given",
            prompt: "The positive qualities of the character of Sherlock Holmes outweigh the negative qualities.",
            answer: "NOT GIVEN",
            explanation: "The passage mentions that Holmes has 'a range of endearing and less endearing habits' but does not compare or weigh his positive and negative qualities."
          },
          {
            id: "q4",
            number: 4,
            type: "true-false-not-given",
            prompt: "Officials at Scotland Yard were unhappy at the way they were portrayed in the Sherlock Holmes stories.",
            answer: "NOT GIVEN",
            explanation: "The passage describes how Scotland Yard officials are portrayed in the stories but does not mention whether the real officials were unhappy about this portrayal."
          },
          {
            id: "q5",
            number: 5,
            type: "true-false-not-given",
            prompt: "Sherlock Holmes is based on a real private detective who was consulted by Scotland Yard.",
            answer: "FALSE",
            explanation: "The passage explicitly states: 'This in itself is pure fiction: in real life there were never any brilliant private detectives to whom Scotland Yard turned when they failed'",
            evidence: "This in itself is pure fiction: in real life there were never any brilliant private detectives to whom Scotland Yard turned when they failed"
          },
          {
            id: "q6",
            number: 6,
            type: "true-false-not-given",
            prompt: "Conan Doyle's work fails to reflect the reality of crime in 19th-century Britain.",
            answer: "TRUE",
            explanation: "The passage states that Holmes stories were set among higher levels of society and 'Few take place among the working classes or the very poor, whereas in fact much crime was a product of the poverty and gangs in London's underworld.'",
            evidence: "Most of the Holmes stories are set among the higher levels of 19th-century British society... Few take place among the working classes or the very poor, whereas in fact much crime was a product of the poverty and gangs in London's underworld."
          },
          {
            id: "q7",
            number: 7,
            type: "true-false-not-given",
            prompt: "In the 1920s and 30s, most writers of detective stories started to include interesting female characters in their work.",
            answer: "FALSE",
            explanation: "The passage states that 'women were often depicted in a simplistic, two-dimensional way, although a few female detective writers would present female characters in a more realistic manner.' This suggests most did NOT include interesting female characters.",
            evidence: "women were often depicted in a simplistic, two-dimensional way, although a few female detective writers would present female characters in a more realistic manner"
          },
          {
            id: "q8",
            number: 8,
            type: "true-false-not-given",
            prompt: "Agatha Christie only earned a few hundred pounds for her books.",
            answer: "FALSE",
            explanation: "The passage states that 'Apart from a few superstars such as Agatha Christie, financial rewards for these interwar authors were rather meagre; a few hundred pounds per book'. This implies Christie was an exception and earned more.",
            evidence: "Apart from a few superstars such as Agatha Christie, financial rewards for these interwar authors were rather meagre; a few hundred pounds per book"
          }
        ]
      },
      {
        instructions: "Complete the table below. Choose ONE WORD ONLY from the passage for each answer.",
        questions: [
          {
            id: "q9",
            number: 9,
            type: "sentence-completion",
            before: "USA",
            after: "1920s–1930s",
            maxWords: 1,
            answer: ["imitations"],
            explanation: "The passage states that US writers' books 'were mere imitations of the British models'",
            evidence: "For the most part their books were mere imitations of the British models"
          },
          {
            id: "q10",
            number: 10,
            type: "sentence-completion",
            before: "USA",
            after: "1920s–1930s",
            maxWords: 1,
            answer: ["violence"],
            explanation: "The passage mentions 'Apart from the violence that appeared throughout their works'",
            evidence: "Apart from the violence that appeared throughout their works"
          },
          {
            id: "q11",
            number: 11,
            type: "sentence-completion",
            before: "USA",
            after: "1920s–1930s",
            maxWords: 1,
            answer: ["political"],
            explanation: "The passage states that Hammett's and Chandler's novels 'were often marked by a political agenda'",
            evidence: "Hammett's and Chandler's novels were often marked by a political agenda"
          },
          {
            id: "q12",
            number: 12,
            type: "sentence-completion",
            before: "Britain",
            after: "from around 1960",
            maxWords: 1,
            answer: ["twists"],
            explanation: "The passage states that writers 'eschewed private detectives for police inspectors, and straightforward puzzles for stories that were full of unexpected twists.'",
            evidence: "eschewed private detectives for police inspectors, and straightforward puzzles for stories that were full of unexpected twists"
          },
          {
            id: "q13",
            number: 13,
            type: "sentence-completion",
            before: "Britain",
            after: "today",
            maxWords: 1,
            answer: ["beneficial"],
            explanation: "The passage states 'The belief that scientific developments were invariably beneficial possibly reached its height during the period when the classic detective story flourished'",
            evidence: "The belief that scientific developments were invariably beneficial possibly reached its height"
          }
        ]
      }
    ]
  },
  {
    slug: "the-plan-to-bring-an-asteroid-to-earth",
    title: "The plan to bring an asteroid to Earth",
    subtitle: "Moving in orbit around our sun are millions of rocks known as asteroids. Now scientists have plans to capture one",
    wordCount: 578,
    headingBank: [
      { id: "i", text: "The potential risks of bringing an asteroid close to Earth" },
      { id: "ii", text: "Advantages of using an asteroid as a base for space missions" },
      { id: "iii", text: "The technical challenges of capturing an asteroid" },
      { id: "iv", text: "Alternative approaches to asteroid capture" },
      { id: "v", text: "The scientific benefits of studying asteroids" },
      { id: "vi", text: "The financial costs and funding options" },
      { id: "vii", text: "The feasibility of the asteroid retrieval plan" },
      { id: "viii", text: "The historical context of asteroid research" }
    ],
    paragraphs: [
      {
        label: "A",
        text: "Send a robot into space, catch an asteroid and bring it back to Earth's orbit. This may sound like science fiction, but it's exactly what scientists and engineers at the California Institute of Technology (Caltech) have been proposing. A four-day workshop was dedicated to investigating the feasibility of capturing a near-Earth asteroid, bringing it closer to our planet and using it as a base for future manned spaceflight missions."
      },
      {
        label: "A",
        text: "This is not something the scientists are imagining could be done some day off in the future. It is possible with the technology we have today and could be accomplished within a decade. A robotic probe could anchor to an asteroid with simple magnets or grab it with specialized claws. Alternatively, a large spacecraft could use its gravitational field to shift the orbit of a larger asteroid, sending it towards Earth."
      },
      {
        label: "A",
        text: "'Once you get over the initial reaction — \"You want to do what?!\" — it actually starts to seem like a reasonable idea,' says engineer John Brophy, who helped organize the workshop. In fact, many of these ideas have been on the drawing board for years as part of the NASA planetary defense program against large space-based objects that might threaten Earth. And there's no shortage of potential targets. NASA estimates there are 19,500 asteroids at least 100 meters wide within 45 million kilometers of Earth."
      },
      {
        label: "B",
        text: "Though rearranging the heavens may seem an excessive undertaking, the US mission has its merits. The US already has plans to send astronauts to a near-earth asteroid, a mission that would mean confining them in a tiny capsule for three to six months and involve all the risks of a deep-space voyage. Instead, robots could bring an asteroid close enough for them to get there in just a month."
      },
      {
        label: "B",
        text: "An asteroid would provide a stationary base from which to launch missions further into space. There are several advantages to this. For one, launching missions carrying materials from Earth requires a lot of power, fuel, and consequently money, because of our planet's strong force of gravity. Since this would be far weaker on an asteroid, materials mined there could be more easily taken off the asteroid and shuttled around the solar system."
      },
      {
        label: "B",
        text: "And many asteroids have a lot to offer. Some are full of metals, which can be mined and used to build space-based habitats, or brought back to Earth. Others are up to one-quarter water, which would either be used for life-support or broken down into hydrogen and oxygen to make fuel. And astronomers would have the chance to get a close-up look at one of the solar system's earliest relics, generating important scientific data. 'Executing the asteroid retrieval plan would help demonstrate and greatly expand mankind's space-based engineering capabilities,' says engineer Louis Friedman, another co-organizer of the Caltech workshop. For instance, the mission would teach engineers how to capture an uncooperative target, which could be useful practice for planetary defense missions in the event of a threat from a meteoroid or comet from space approaching our planet,' he adds."
      },
      {
        label: "C",
        text: "Former astronaut Rusty Schweickart, cofounder of the B612 Foundation, an organization dedicated to protecting Earth from asteroid strikes, points out that though it would be technically feasible, shifting such a hefty and substantial target would not be easy: \"You're moving the largest mother lode imaginable,\" he says."
      },
      {
        label: "C",
        text: "Engineers would need to be absolutely certain they could control such a potentially dangerous object. \"It's the opposite of planetary defense: if you do something wrong you have a Tunguska event,\" says engineer Marco Tantardini from the Planetary Society, referring to the powerful 1908 explosion above a remote Russian region thought to have been caused by a meteoroid or comet."
      },
      {
        label: "D",
        text: "Still, these obstacles only add to the appeal of the project for engineers, who love to go over every potential difficulty in order to solve it. And if the challenges for a large asteroid seem too daunting, researchers could always start with a smaller asteroid — perhaps 2 to 10 meters across. Last year, Brophy helped conduct a study to look at the feasibility of bringing a two-meter, 1,000 kilogram asteroid — of which there might conceivably be millions — to the International Space Station. The study suggested the asteroid could be captured robotically in something as simple as a large bag. Of course, such a small object might not have the same emotional impact as a larger target. 'NASA isn't going to want to go to something that is smaller than our spaceships,' says engineer Dan Mazanek from NASA Langley Research Center."
      },
      {
        label: "E",
        text: "No matter the size of the asteroid, these plans would require hefty investments. Even capturing a small asteroid would consume at least a billion dollars. Convincing taxpayers to foot such a bill could be difficult. However, private industry might be interested in getting involved. One possibility would be to push the asteroid to near-Earth orbit and then invite anyone who wants to develop the capabilities to reach and mine the object. However, though the undertaking might be scientifically exciting, and provide great insight into the solar system formation, this is not enough on its own to justify the expense of bringing an asteroid to Earth. Investigations of asteroids can be done much more cheaply with an unmanned spacecraft, says chemist Joseph A Nuth from NASA's Goddard Space Flight Center. According to Brophy, ultimately, we would be working towards bringing an asteroid closer to Earth in order to help move out into the solar system."
      }
    ],
    questionGroups: [
      {
        instructions: "The passage has five paragraphs, A–E. Which paragraph contains the following information? Write the correct letter, A–E, in boxes 14–18 on your answer sheet.",
        questions: [
          {
            id: "q14",
            number: 14,
            type: "matching-headings",
            paragraphLabel: "Paragraph A",
            prompt: "The feasibility of the asteroid retrieval plan",
            answer: "vii",
            explanation: "Paragraph A discusses the feasibility of capturing an asteroid with current technology and mentions it could be accomplished within a decade.",
            evidence: "It is possible with the technology we have today and could be accomplished within a decade."
          },
          {
            id: "q15",
            number: 15,
            type: "matching-headings",
            paragraphLabel: "Paragraph B",
            prompt: "Advantages of using an asteroid as a base",
            answer: "ii",
            explanation: "Paragraph B describes the advantages of using an asteroid as a base, including reduced gravity for launching materials and access to resources like metals and water.",
            evidence: "An asteroid would provide a stationary base from which to launch missions further into space. There are several advantages to this."
          },
          {
            id: "q16",
            number: 16,
            type: "matching-headings",
            paragraphLabel: "Paragraph C",
            prompt: "Risks associated with moving an asteroid",
            answer: "i",
            explanation: "Paragraph C discusses the risks of moving a large asteroid, including the danger of losing control and causing a Tunguska-like event.",
            evidence: "Engineers would need to be absolutely certain they could control such a potentially dangerous object. \"It's the opposite of planetary defense: if you do something wrong you have a Tunguska event\""
          },
          {
            id: "q17",
            number: 17,
            type: "matching-headings",
            paragraphLabel: "Paragraph D",
            prompt: "Technical challenges of the project",
            answer: "iii",
            explanation: "Paragraph D discusses the technical challenges and suggests starting with smaller asteroids if large ones prove too difficult.",
            evidence: "And if the challenges for a large asteroid seem too daunting, researchers could always start with a smaller asteroid"
          },
          {
            id: "q18",
            number: 18,
            type: "matching-headings",
            paragraphLabel: "Paragraph E",
            prompt: "Financial costs and funding",
            answer: "vi",
            explanation: "Paragraph E discusses the financial costs (at least a billion dollars) and potential funding from private industry.",
            evidence: "No matter the size of the asteroid, these plans would require hefty investments. Even capturing a small asteroid would consume at least a billion dollars."
          }
        ]
      },
      {
        instructions: "Look at the following statements (Questions 19–22) and the list of people below. Match each statement with the correct person, A–E. Write the correct letter, A–E, in boxes 19–22 on your answer sheet.",
        questions: [
          {
            id: "q19",
            number: 19,
            type: "multiple-choice",
            prompt: "Believes the project would help develop skills useful for planetary defense.",
            options: [
              { key: "A", text: "John Brophy" },
              { key: "B", text: "Louis Friedman" },
              { key: "C", text: "Rusty Schweickart" },
              { key: "D", text: "Marco Tantardini" },
              { key: "E", text: "Dan Mazanek" }
            ],
            answer: "B",
            explanation: "Louis Friedman states that the mission would teach engineers how to capture an uncooperative target, which could be useful practice for planetary defense missions.",
            evidence: "the mission would teach engineers how to capture an uncooperative target, which could be useful practice for planetary defense missions"
          },
          {
            id: "q20",
            number: 20,
            type: "multiple-choice",
            prompt: "Warns about the potential danger of losing control of an asteroid.",
            options: [
              { key: "A", text: "John Brophy" },
              { key: "B", text: "Louis Friedman" },
              { key: "C", text: "Rusty Schweickart" },
              { key: "D", text: "Marco Tantardini" },
              { key: "E", text: "Dan Mazanek" }
            ],
            answer: "D",
            explanation: "Marco Tantardini warns that if you do something wrong you could have a Tunguska event, referring to the danger of losing control.",
            evidence: "\"It's the opposite of planetary defense: if you do something wrong you have a Tunguska event\""
          },
          {
            id: "q21",
            number: 21,
            type: "multiple-choice",
            prompt: "Suggests that NASA would prefer to target larger asteroids.",
            options: [
              { key: "A", text: "John Brophy" },
              { key: "B", text: "Louis Friedman" },
              { key: "C", text: "Rusty Schweickart" },
              { key: "D", text: "Marco Tantardini" },
              { key: "E", text: "Dan Mazanek" }
            ],
            answer: "E",
            explanation: "Dan Mazanek states that 'NASA isn't going to want to go to something that is smaller than our spaceships', suggesting they'd prefer larger targets.",
            evidence: "'NASA isn't going to want to go to something that is smaller than our spaceships'"
          },
          {
            id: "q22",
            number: 22,
            type: "multiple-choice",
            prompt: "Points out that moving a large asteroid would be technically difficult.",
            options: [
              { key: "A", text: "John Brophy" },
              { key: "B", text: "Louis Friedman" },
              { key: "C", text: "Rusty Schweickart" },
              { key: "D", text: "Marco Tantardini" },
              { key: "E", text: "Dan Mazanek" }
            ],
            answer: "C",
            explanation: "Rusty Schweickart points out that 'shifting such a hefty and substantial target would not be easy'.",
            evidence: "shifting such a hefty and substantial target would not be easy"
          }
        ]
      },
      {
        instructions: "Complete the summary below. Choose NO MORE THAN ONE WORD from the passage for each answer.",
        questions: [
          {
            id: "q23",
            number: 23,
            type: "sentence-completion",
            before: "An asteroid could serve as a",
            after: "for launching missions further into space.",
            maxWords: 1,
            answer: ["base"],
            explanation: "The passage states 'An asteroid would provide a stationary base from which to launch missions further into space.'",
            evidence: "An asteroid would provide a stationary base from which to launch missions further into space."
          },
          {
            id: "q24",
            number: 24,
            type: "sentence-completion",
            before: "Launching from Earth requires more power due to its strong",
            after: "",
            maxWords: 1,
            answer: ["gravity"],
            explanation: "The passage mentions 'because of our planet's strong force of gravity'.",
            evidence: "because of our planet's strong force of gravity"
          },
          {
            id: "q25",
            number: 25,
            type: "sentence-completion",
            before: "Asteroids contain valuable resources such as",
            after: "which can be mined.",
            maxWords: 1,
            answer: ["metals"],
            explanation: "The passage states 'Some are full of metals, which can be mined and used to build space-based habitats'",
            evidence: "Some are full of metals, which can be mined and used to build space-based habitats"
          },
          {
            id: "q26",
            number: 26,
            type: "sentence-completion",
            before: "Some asteroids contain up to one-quarter",
            after: "which can be used for life-support or fuel.",
            maxWords: 1,
            answer: ["water"],
            explanation: "The passage states 'Others are up to one-quarter water, which would either be used for life-support or broken down into hydrogen and oxygen to make fuel.'",
            evidence: "Others are up to one-quarter water, which would either be used for life-support or broken down into hydrogen and oxygen to make fuel"
          }
        ]
      }
    ]
  },
  {
    slug: "the-science-of-sleep",
    title: "The science of sleep",
    subtitle: "Emma Bailey explores the curious world of deep (or NREM) sleep and light (or REM) sleep",
    wordCount: 642,
    paragraphs: [
      {
        label: "",
        text: "Sleep is not an optional activity and is more essential to our survival than food. By the time they die, most people will have spent more than 25 years asleep. As Paul Martin, author of Counting Sheep: The Science and Pleasures of sleep and Dreams, puts it: 'When you die, a bigger slice of your existence will have passed in this state than in raising children, playing games, listening to music, or any other activity that humanity values highly.' Why is it necessary to spend quite so long in this unconscious state? Unlike breathing or eating, the biological benefits of sleep are not immediately obvious."
      },
      {
        label: "",
        text: "It is a behaviour that can be found remarkably far back down the evolutionary ladder. In all creatures, sleep generally involves a cessation of physical activity and reduction of sensory awareness for regular periods. Like us, other animals are kept awake by stimulants such as caffeine and sleep more as babies."
      },
      {
        label: "",
        text: "Sleep is therefore a mainstay of animal existence and has been honed by millions of years of evolution. Yet until 1952, scientists assumed it was a passive state in which brain activity ceased. But then an extraordinary discovery was made. Sleep research pioneer Nathaniel Kleitman, of the University of Chicago, noticed it was marked by periods of rapid eye movement, now known as REM sleep, and that REM sleep was accompanied by a frenzy of brain activity akin to that seen during periods of consciousness."
      },
      {
        label: "",
        text: "We now know that brain activity is far from uniform while we sleep. Over a 60-minute period it goes through four distinct stages of NON-REM (NREM) sleep, and one episode of REM sleep. It has been discovered that most dreaming occurs during REM sleep, and that deep sleep occurs during the NREM stages. In fact, the two types of sleep are as different as sleeping is from wakefulness. Interestingly, while all mammals, birds and more recent reptiles have both types of sleep, primitive reptiles experience just NREM sleep. This implies that REM sleep evolved more recently, possibly around the time of the reptilian ancestors of all mammals, 250 million years ago."
      },
      {
        label: "",
        text: "For centuries it was assumed that sleep served simply as a mechanism for allowing the body to recuperate. Recently, it has been shown that NREM sleep does indeed increase after vigorous exercise. However, people who lie in bed all day also enter NREM sleep, so it can't only be due to this. Jerome M Siegel of the University of California believes that NREM sleep provides an opportunity to repair the body cells damaged during wakefulness. As he explains, 'The decrease both in metabolic rate and in brain temperature occurring during NREM sleep seems to provide an opportunity to repair this damage.'"
      },
      {
        label: "",
        text: "However, Professor Jim Horne of the University of Loughborough disagrees: 'There is little evidence that any organ apart from the brain goes through repair during sleep. All the evidence shows that these other organs recover just as well during restful wakefulness.' The brain, Horne points out, never shuts down during wakefulness. Even if we are resting, it remains in a state of readiness. Scans have shown that it is only during NREM sleep that the brain gets any rest. Recognising that when NREM sleep evolved millions of years ago, animals didn't have highly developed brains, he concludes, 'The functions of NREM sleep have probably changed with evolution, maybe beginning as an energy conserver, and culminating, in humans, as a facilitator for the recovery of high-level brain function.'"
      },
      {
        label: "",
        text: "While NREM most probably involves rest and recovery, REM sleep and dreams is a much more contentious area of research. According to Dr Claudio Stampi, deprived of REM sleep, memory consolidation is compromised. 'We need it to reprocess what has happened during the previous period of wakefulness in order to store information that is useful.'"
      },
      {
        label: "",
        text: "Certainly, there are studies that suggest a strong link between REM sleep and memory. After being taught a new skill, people exhibit a rise in REM sleep. If they are deprived of REM sleep, they are less able to remember the skill. Experiments have shown that REM sleep must occur within 24 hours of an experience if it is to be remembered."
      },
      {
        label: "",
        text: "There are other views about the function of REM sleep. The pioneering sleep researcher Michel Jouvet believes that the intense activity seen in the brain during REM sleep is essential to neuronal development before birth. There is little to activate the developing brain during the long, dark months in the uterus, so Jouvet hypotheses that the brain generates its own stimuli in the form of REM sleep and dreams to aid its own development."
      },
      {
        label: "",
        text: "In short, the function of REM sleep and dreaming is still something of a mystery. The hope is that, as scanning techniques become more refined, the brain regions underlying the two types of sleep will be better understood. However, we're not likely to get a straightforward answer. As Horne says: 'Already over 100 neurochemicals and brain regions connected with sleep have been found, and more and more are being discovered. So clearly there's no single sleep centre.' One thing is certain, we'll never be without sleep. It's highly improbable that any new drug could enable us to avoid it and remain healthy for any length of time."
      }
    ],
    questionGroups: [
      {
        instructions: "Look at the following statements (Questions 27–32) and the list of researchers below. Match each statement with the correct researcher, A–E. Write the correct letter, A–E, in boxes 27–32 on your answer sheet.",
        questions: [
          {
            id: "q27",
            number: 27,
            type: "multiple-choice",
            prompt: "Believes that REM sleep is important for memory consolidation.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "A",
            explanation: "Dr Claudio Stampi states that 'deprived of REM sleep, memory consolidation is compromised' and that we need REM sleep to reprocess information.",
            evidence: "According to Dr Claudio Stampi, deprived of REM sleep, memory consolidation is compromised. 'We need it to reprocess what has happened during the previous period of wakefulness in order to store information that is useful.'"
          },
          {
            id: "q28",
            number: 28,
            type: "multiple-choice",
            prompt: "Believes NREM sleep allows the body to repair cells.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "B",
            explanation: "Jerome M Siegel believes that NREM sleep provides an opportunity to repair body cells damaged during wakefulness.",
            evidence: "Jerome M Siegel of the University of California believes that NREM sleep provides an opportunity to repair the body cells damaged during wakefulness."
          },
          {
            id: "q29",
            number: 29,
            type: "multiple-choice",
            prompt: "Believes only the brain needs sleep for recovery.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "C",
            explanation: "Professor Jim Horne states 'There is little evidence that any organ apart from the brain goes through repair during sleep' and that only the brain gets rest during NREM sleep.",
            evidence: "There is little evidence that any organ apart from the brain goes through repair during sleep. Scans have shown that it is only during NREM sleep that the brain gets any rest."
          },
          {
            id: "q30",
            number: 30,
            type: "multiple-choice",
            prompt: "Believes REM sleep aids brain development before birth.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "D",
            explanation: "Michel Jouvet believes that the intense brain activity during REM sleep is essential to neuronal development before birth.",
            evidence: "The pioneering sleep researcher Michel Jouvet believes that the intense activity seen in the brain during REM sleep is essential to neuronal development before birth."
          },
          {
            id: "q31",
            number: 31,
            type: "multiple-choice",
            prompt: "Discovered that sleep involves periods of rapid eye movement.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "E",
            explanation: "Nathaniel Kleitman noticed that sleep was marked by periods of rapid eye movement (REM sleep).",
            evidence: "Sleep research pioneer Nathaniel Kleitman, of the University of Chicago, noticed it was marked by periods of rapid eye movement, now known as REM sleep"
          },
          {
            id: "q32",
            number: 32,
            type: "multiple-choice",
            prompt: "Believes the function of NREM sleep has evolved over time.",
            options: [
              { key: "A", text: "Claudio Stampi" },
              { key: "B", text: "Jerome M Siegel" },
              { key: "C", text: "Jim Horne" },
              { key: "D", text: "Michel Jouvet" },
              { key: "E", text: "Nathaniel Kleitman" }
            ],
            answer: "C",
            explanation: "Jim Horne concludes that 'The functions of NREM sleep have probably changed with evolution, maybe beginning as an energy conserver, and culminating, in humans, as a facilitator for the recovery of high-level brain function.'",
            evidence: "The functions of NREM sleep have probably changed with evolution, maybe beginning as an energy conserver, and culminating, in humans, as a facilitator for the recovery of high-level brain function."
          }
        ]
      },
      {
        instructions: "Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        questions: [
          {
            id: "q33",
            number: 33,
            type: "sentence-completion",
            before: "Sleep involves a cessation of physical activity and reduction of",
            after: "",
            maxWords: 2,
            answer: ["sensory awareness"],
            explanation: "The passage states 'sleep generally involves a cessation of physical activity and reduction of sensory awareness'",
            evidence: "sleep generally involves a cessation of physical activity and reduction of sensory awareness"
          },
          {
            id: "q34",
            number: 34,
            type: "sentence-completion",
            before: "Like humans, animals sleep more when they are",
            after: "",
            maxWords: 1,
            answer: ["babies"],
            explanation: "The passage states 'Like us, other animals are kept awake by stimulants such as caffeine and sleep more as babies.'",
            evidence: "Like us, other animals are kept awake by stimulants such as caffeine and sleep more as babies"
          },
          {
            id: "q35",
            number: 35,
            type: "sentence-completion",
            before: "REM sleep is accompanied by increased",
            after: "",
            maxWords: 2,
            answer: ["brain activity"],
            explanation: "The passage states 'REM sleep was accompanied by a frenzy of brain activity'",
            evidence: "REM sleep was accompanied by a frenzy of brain activity"
          },
          {
            id: "q36",
            number: 36,
            type: "sentence-completion",
            before: "NREM sleep increases after",
            after: "",
            maxWords: 2,
            answer: ["vigorous exercise", "exercise"],
            explanation: "The passage states 'NREM sleep does indeed increase after vigorous exercise'",
            evidence: "NREM sleep does indeed increase after vigorous exercise"
          },
          {
            id: "q37",
            number: 37,
            type: "sentence-completion",
            before: "During NREM sleep, there is a decrease in brain",
            after: "",
            maxWords: 1,
            answer: ["temperature"],
            explanation: "The passage mentions 'The decrease both in metabolic rate and in brain temperature occurring during NREM sleep'",
            evidence: "The decrease both in metabolic rate and in brain temperature occurring during NREM sleep"
          },
          {
            id: "q38",
            number: 38,
            type: "sentence-completion",
            before: "Better understanding of sleep may come from improved",
            after: "",
            maxWords: 2,
            answer: ["scanning techniques", "scanning technique"],
            explanation: "The passage states 'the hope is that, as scanning techniques become more refined, the brain regions underlying the two types of sleep will be better understood'",
            evidence: "the hope is that, as scanning techniques become more refined, the brain regions underlying the two types of sleep will be better understood"
          },
          {
            id: "q39",
            number: 39,
            type: "sentence-completion",
            before: "It is unlikely that a",
            after: "could eliminate the need for sleep.",
            maxWords: 3,
            answer: ["new drug", "a new drug", "drug"],
            explanation: "The passage states 'It's highly improbable that any new drug could enable us to avoid it and remain healthy'",
            evidence: "It's highly improbable that any new drug could enable us to avoid it and remain healthy"
          }
        ]
      },
      {
        instructions: "Choose the correct letter, A, B, C, or D. Write the correct letter in box 40 on your answer sheet.",
        questions: [
          {
            id: "q40",
            number: 40,
            type: "multiple-choice",
            prompt: "What does the writer say about the function of sleep?",
            options: [
              { key: "A", text: "It allows the body to recover from physical exertion." },
              { key: "B", text: "It enables the brain to process and store information." },
              { key: "C", text: "Its primary purpose is to conserve energy." },
              { key: "D", text: "It serves multiple purposes that are not fully understood." }
            ],
            answer: "D",
            explanation: "The passage concludes that 'the function of REM sleep and dreaming is still something of a mystery' and that 'there's no single sleep centre', indicating sleep serves multiple purposes that are not fully understood.",
            evidence: "In short, the function of REM sleep and dreaming is still something of a mystery... So clearly there's no single sleep centre."
          }
        ]
      }
    ]
  },
  {
    slug: "australias-megafauna-controversy",
    title: "Australia's Megafauna Controversy",
    subtitle: "Just how long did humans live side by side with megafauna in Australia? Barry Brook, Richard Gillespie and Paul Martin dispute previous claims of a lengthy coexistence.",
    wordCount: 872,
    paragraphs: [
      {
        label: "",
        text: "Over the past 50 millennia, Australia has witnessed the extinction of many species of large animals, including a rhinoceros-sized wombat and goannas the size of crocodiles. Debate about the possible cause of these extinctions has continued for more than 150 years, and one of the crucial questions raised is how long humans and megafauna coexisted in Australia. We need to know the overlap of time to make an informed choice between the two main theories regarding the causes of these extinctions. If humans and megafauna coexisted for a protracted period, then climate change is the more likely cause. However, if the megafauna became extinct shortly after the arrival of humans, then humans are the likely culprits."
      },
      {
        label: "",
        text: "The archaeological site at Cuddie Springs in eastern Australia appears to be well preserved. This dusty claypan holds within its sediments a rich cache of flaked stone and seed-grinding tools, and side by side with these clear signals of human culture are the bones of a dozen or more species of megafauna. Drs Judith Field and Stephen Wroe of the University of Sydney, who excavated the site, claim that it provides unequivocal evidence of a long overlap of humans and megafauna, and conclude that aridity leading up to the last Ice Age brought about their eventual demise. In the long-standing explanation of this site, artefacts such as stone tools and extinct animal remains were deposited over many thousands of years in an ephemeral lake – a body of water existing for a relatively short time – and remained in place and undisturbed until the present day."
      },
      {
        label: "",
        text: "There is no disputing the close association of bones and stones at Cuddie Springs, as both are found 1 to 1.7 metres below the modern surface. The dating of these layers is accurate: ages for the sediments were obtained through radiocarbon dating of charcoal fragments and luminescence dating of sand grains from the same levels (revealing when a sample was last exposed to sunlight). Intriguingly, some of the stone tools show surface features indicating their use for processing plants, and a few even have well-preserved blood and hair residues suggesting they were used in butchering animals."
      },
      {
        label: "",
        text: "But is the case proposed by Field and Wroe clear-cut? We carried out a reanalysis of the scientific data from Cuddie Springs that brings into question their conclusions. The amount of anthropological evidence found at the site is remarkable: we estimate there are more than 3 tonnes of charcoal and more than 300 tonnes of stone buried there. Field and Wroe estimate that there are approximately 20 million artefacts. This plethora of tools is hard to reconcile with a site that was only available for occupation when the lake was dry. Furthermore, no cultural features such as oven pits have been discovered. If the sediment layers have remained undisturbed since being laid down, as Field and Wroe contend, then the ages of those sediments should increase with depth. However, our analysis revealed a number of inconsistencies."
      },
      {
        label: "",
        text: "First, the charcoal samples are all roughly 36,000 years old. Second, sand in the two upper levels is considerably younger than charcoal from the same levels. Third, Field and Wroe say that the tools and seed-grinding stones used for plant and animal processing are ancient, yet they are very similar to implements found elsewhere that were in use only a few thousand years ago. Also of interest is the fact that a deep drill core made a mere 60 metres from the site recovered no stone artefacts or fossil bones whatsoever. These points suggest strongly that the sediments have been moved about and some of the old charcoal has been re-deposited in younger layers. Indeed, one sample of cow bone found 1 metre below the surface came from sediments where charcoal dated at 6,000 and 23,000 years old is mixed with 17,000-year-old sand. The megafauna bones themselves have not yet been dated, although new technological developments make this a possibility in the near future."
      },
      {
        label: "",
        text: "We propose that the archaeologists have actually been sampling the debris carried by ancient flood channels beneath the site, including charcoal transported from bushfires that intermittently occurred within the catchment. Flood events more likely explain the accumulation of megafauna remains, and could have mixed old bones with fresh deposits. European graziers also disturbed the site in 1876 by constructing a well to provide water for their cattle. Given the expense of well-digging, we speculate that the graziers made sure it was protected from the damage caused by cattle hooves by lining the surface with small stones collected from further afield, including prehistoric quarries. This idea is consistent with the thin layer of stones spread over a large area, with cattle occasionally breaking through the gravel surface and forcing the stone and even cattle bones deeper into the waterlogged soil."
      },
      {
        label: "",
        text: "The lack of conclusive evidence that humans and megafauna coexisted for a lengthy period casts doubt on Field and Wroe's assertion that climate change was responsible for the extinction of Australia's megafauna. However, we do not suggest that newly arrived, well-armed hunters systematically slaughtered all the large beasts they encountered. Recent studies based on the biology of modern-day large mammals, combined with observations of people who still practise a traditional hunter-gatherer lifestyle, reveal an unexpected paradox and suggest a further possible explanation as to what happened. Using a mathematical model, it was found that a group of 10 people killing only one juvenile Diprotodon each year would be sufficient to bring about the extinction of that species within 1,000 years. This suggests that here, as in other parts of the world, the arrival of humans in lands previously inhabited only by animals created a volatile combination in which large animals fared badly."
      }
    ],
    questionGroups: [
      {
        instructions: "Do the following statements agree with the claims of the writer in Reading Passage 3? In boxes 27–30 on your answer sheet, write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.",
        questions: [
          {
            id: "q27",
            number: 27,
            type: "yes-no-not-given",
            prompt: "Field and Wroe argue that findings at the Cuddie Springs site show that people lived in this area at the same time as megafauna.",
            answer: "YES",
            explanation: "The passage states that Field and Wroe 'claim that it provides unequivocal evidence of a long overlap of humans and megafauna', which means they argue people lived at the same time as megafauna.",
            evidence: "Drs Judith Field and Stephen Wroe of the University of Sydney, who excavated the site, claim that it provides unequivocal evidence of a long overlap of humans and megafauna"
          },
          {
            id: "q28",
            number: 28,
            type: "yes-no-not-given",
            prompt: "Field and Wroe believe it is likely that smaller megafauna species survived the last Ice Age.",
            answer: "NOT GIVEN",
            explanation: "The passage does not mention whether Field and Wroe believe smaller megafauna species survived the last Ice Age. They conclude that aridity brought about the demise of megafauna, but no information is given about smaller species specifically surviving.",
          },
          {
            id: "q29",
            number: 29,
            type: "yes-no-not-given",
            prompt: "The writers believe that the dating of earth up to 1.7 m below the present surface at Cuddie Springs is unreliable.",
            answer: "YES",
            explanation: "The writers state that their analysis 'revealed a number of inconsistencies' in the dating, including that sand in upper levels is younger than charcoal from the same levels, suggesting the sediments have been moved about.",
            evidence: "However, our analysis revealed a number of inconsistencies. First, the charcoal samples are all roughly 36,000 years old. Second, sand in the two upper levels is considerably younger than charcoal from the same levels."
          },
          {
            id: "q30",
            number: 30,
            type: "yes-no-not-given",
            prompt: "Some artefacts found at Cuddie Springs were preserved well enough to reveal their function.",
            answer: "YES",
            explanation: "The passage states that 'some of the stone tools show surface features indicating their use for processing plants, and a few even have well-preserved blood and hair residues suggesting they were used in butchering animals.'",
            evidence: "Intriguingly, some of the stone tools show surface features indicating their use for processing plants, and a few even have well-preserved blood and hair residues suggesting they were used in butchering animals."
          }
        ]
      },
      {
        instructions: "Complete the summary using the list of words, A–I, below. Write the correct letter, A–I, in boxes 31–35 on your answer sheet.",
        questions: [
          {
            id: "q31",
            number: 31,
            type: "sentence-completion",
            before: "One objection to Field and Wroe's interpretation is the large quantity of charcoal,",
            after: "and artefacts found at Cuddie Springs.",
            maxWords: 1,
            answer: ["B"],
            explanation: "The passage mentions 'more than 300 tonnes of stone buried there', and option B is 'stone'.",
            evidence: "The amount of anthropological evidence found at the site is remarkable: we estimate there are more than 3 tonnes of charcoal and more than 300 tonnes of stone buried there."
          },
          {
            id: "q32",
            number: 32,
            type: "sentence-completion",
            before: "Such large numbers of artefacts would be impossible if the area had been covered with",
            after: "for a period.",
            maxWords: 1,
            answer: ["F"],
            explanation: "The passage discusses that the site was 'only available for occupation when the lake was dry', and option F is 'water'.",
            evidence: "This plethora of tools is hard to reconcile with a site that was only available for occupation when the lake was dry."
          },
          {
            id: "q33",
            number: 33,
            type: "sentence-completion",
            before: "There is also a complete lack of man-made structures, for instance those used for",
            after: "",
            maxWords: 1,
            answer: ["D"],
            explanation: "The passage mentions 'no cultural features such as oven pits have been discovered', and option D is 'cooking'.",
            evidence: "Furthermore, no cultural features such as oven pits have been discovered."
          },
          {
            id: "q34",
            number: 34,
            type: "sentence-completion",
            before: "Other evidence that casts doubt on Field and Wroe's claim is the fact that while some material in the highest levels of sediment is 36,000 years old, the",
            after: "in the same levels is much more recent.",
            maxWords: 1,
            answer: ["C"],
            explanation: "The passage states 'sand in the two upper levels is considerably younger than charcoal from the same levels', and option C is 'sand'.",
            evidence: "Second, sand in the two upper levels is considerably younger than charcoal from the same levels."
          },
          {
            id: "q35",
            number: 35,
            type: "sentence-completion",
            before: "Further evidence against human occupation of the area is the absence of tools and",
            after: "just a short distance from the site.",
            maxWords: 1,
            answer: ["G"],
            explanation: "The passage mentions that a deep drill core 'recovered no stone artefacts or fossil bones whatsoever', and option G is 'fossil bones'.",
            evidence: "Also of interest is the fact that a deep drill core made a mere 60 metres from the site recovered no stone artefacts or fossil bones whatsoever."
          }
        ]
      },
      {
        instructions: "Choose the correct letter, A, B, C, or D. Write the correct letter in boxes 36–40 on your answer sheet.",
        questions: [
          {
            id: "q36",
            number: 36,
            type: "multiple-choice",
            prompt: "What conclusions did the writers reach about the inconsistencies in the data from Cuddie Springs?",
            options: [
              { key: "A", text: "The different layers of sediment have been mixed over time." },
              { key: "B", text: "The sand evidence is unhelpful and should be disregarded." },
              { key: "C", text: "The area needs to be re-examined when technology improves." },
              { key: "D", text: "The charcoal found in the area cannot be dated." }
            ],
            answer: "A",
            explanation: "The writers conclude that 'These points suggest strongly that the sediments have been moved about and some of the old charcoal has been re-deposited in younger layers', which means the layers have been mixed.",
            evidence: "These points suggest strongly that the sediments have been moved about and some of the old charcoal has been re-deposited in younger layers."
          },
          {
            id: "q37",
            number: 37,
            type: "multiple-choice",
            prompt: "According to the writers, what impact could a natural phenomenon have had on this site?",
            options: [
              { key: "A", text: "Floods could have caused the death of the megafauna." },
              { key: "B", text: "Floods could have disturbed the archaeological evidence." },
              { key: "C", text: "Bushfires could have prevented humans from settling in the area for any length of time." },
              { key: "D", text: "Bushfires could have destroyed much of the evidence left by megafauna and humans." }
            ],
            answer: "B",
            explanation: "The writers propose that 'Flood events more likely explain the accumulation of megafauna remains, and could have mixed old bones with fresh deposits', indicating floods disturbed the evidence.",
            evidence: "We propose that the archaeologists have actually been sampling the debris carried by ancient flood channels beneath the site, including charcoal transported from bushfires that intermittently occurred within the catchment. Flood events more likely explain the accumulation of megafauna remains, and could have mixed old bones with fresh deposits."
          },
          {
            id: "q38",
            number: 38,
            type: "multiple-choice",
            prompt: "What did the writers speculate about the people who lived at this site in 1876?",
            options: [
              { key: "A", text: "They bred cattle whose bones could have been confused with megafauna." },
              { key: "B", text: "They found that the soil was too waterlogged for farming." },
              { key: "C", text: "They allowed cattle to move around freely at the site." },
              { key: "D", text: "They brought stones there from another area." }
            ],
            answer: "D",
            explanation: "The writers speculate that 'the graziers made sure it was protected from the damage caused by cattle hooves by lining the surface with small stones collected from further afield, including prehistoric quarries.'",
            evidence: "we speculate that the graziers made sure it was protected from the damage caused by cattle hooves by lining the surface with small stones collected from further afield, including prehistoric quarries."
          },
          {
            id: "q39",
            number: 39,
            type: "multiple-choice",
            prompt: "In the final paragraph, what suggestion do the writers make about Australia's megafauna?",
            options: [
              { key: "A", text: "A rapid change in climate may have been responsible for the extinction of the megafauna." },
              { key: "B", text: "Megafauna could have died out as a result of small numbers being killed year after year." },
              { key: "C", text: "The population of humans at that time was probably insufficient to cause the extinction of the megafauna." },
              { key: "D", text: "The extinction of ancient animals should not be compared to that of modern-day species." }
            ],
            answer: "B",
            explanation: "The writers state that 'a group of 10 people killing only one juvenile Diprotodon each year would be sufficient to bring about the extinction of that species within 1,000 years', suggesting small numbers killed over time caused extinction.",
            evidence: "Using a mathematical model, it was found that a group of 10 people killing only one juvenile Diprotodon each year would be sufficient to bring about the extinction of that species within 1,000 years."
          },
          {
            id: "q40",
            number: 40,
            type: "multiple-choice",
            prompt: "Which of the following best represents the writers' criticism of Field and Wroe?",
            options: [
              { key: "A", text: "Their methods were not well thought out." },
              { key: "B", text: "The excavations did not go deep enough." },
              { key: "C", text: "Their technology failed to obtain precise data." },
              { key: "D", text: "Their conclusions were based on inconsistent data." }
            ],
            answer: "D",
            explanation: "The writers carried out a reanalysis that 'revealed a number of inconsistencies' in the data, and conclude that Field and Wroe's conclusions are questionable because the sediments have been disturbed.",
            evidence: "But is the case proposed by Field and Wroe clear-cut? We carried out a reanalysis of the scientific data from Cuddie Springs that brings into question their conclusions. However, our analysis revealed a number of inconsistencies."
          }
        ]
      }
    ]
  }
];
