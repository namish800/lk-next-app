import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET() {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Generate participant token
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  const metadata = {
    "customer_name": "Namish",
    "phone_number": "+919988877025",
    "survey": {
        "company_name": "Poochku",
        "survey_name": "Poochku Homemade Food NPS Survey",
        "survey_goal": "Calculate NPS scores from customers who recently purchased from the new homemade food product line",
        "intro_text": "Hi [Customer Name], this is [Agent Name] calling from Poochku. We hope your pet is loving their new homemade food! We'd love to get your quick feedback on your recent purchase - this will only take about 2-3 minutes of your time.",
        "closing_text": "Thank you so much for your time and feedback. We really appreciate you choosing Poochku for your pet's nutrition needs!",
        "first_question_id": "recSdFHIf2vwk2KyK",
        "questions": [
            {
                "question_id": "recSdFHIf2vwk2KyK",
                "text": "On a scale of 0 to 10, how likely are you to recommend Poochku's homemade food to other pet owners?",
                "type": "rating",
                "min_value": "0",
                "max_value": "10",
                "options": "{}"
            },
            {
                "question_id": "recnkwY15XroRvTZK",
                "text": "What specifically do you like most about Poochku's homemade food?",
                "type": "open_text",
                "min_value": "0",
                "max_value": "0",
                "options": "{}"
            },
            {
                "question_id": "receMAieed58I2XD9",
                "text": "Have you noticed any changes in your pet since switching to our homemade food? If so, what changes?",
                "type": "open_text",
                "min_value": "0",
                "max_value": "0",
                "options": "{}"
            },
            {
                "question_id": "recEwmH3N3FLODaJX",
                "text": "Do you have any suggestions for how we could improve our homemade food products?",
                "type": "open_text",
                "min_value": "0",
                "max_value": "0",
                "options": "{}"
            },
            {
                "question_id": "rec6jWyfkPOTpCpoJ",
                "text": "What was the main reason you chose Poochku's homemade food?",
                "type": "multiple_choice",
                "min_value": "0",
                "max_value": "0",
                "options": "{\"1\": \"Natural ingredients\", \"2\": \"Better nutrition\", \"3\": \"Vet recommendation\", \"4\": \"Pet's preference\", \"5\": \"Price/value\"}"
            }
        ]
    },
    "call_log_id": "recvBQP5QqRBrMBhe"
}
  const questions_text = metadata.survey.questions.map((question) => {
    let text = `Question ID: ${question.question_id}\n`;
    text += `Question: ${question.text}\n`;

    if (question.type === "rating") {
      text += `Type: Rating scale from ${question.min_value} to ${question.max_value}\n`;
    } else if (question.type === "multiple_choice" && question.options) {
      text += "Type: Multiple choice\n";
      text += "Options:\n";
      const options = JSON.parse(question.options);
      Object.entries(options).forEach(([key, value]) => {
        text += `- ${key}: ${value}\n`;
      });
    } else {
      text += `Type: ${question.type}\n`;
    }

    text += "\n";
    return text;
  }).join("");
  const metadata2 = {
    "agent_id": "test_agent",
    "call_id": "john-doe-123-call",
    "customer_name": metadata.customer_name,
    "customer_id": "john-doe-123-customer",
    "phone_number": metadata.phone_number,
    "agent_data": {
      "company_name": metadata.survey.company_name,
      "survey_goal": metadata.survey.survey_goal,
      "questions_text": questions_text,
      "first_question_id": metadata.survey.first_question_id,
      "closing_text": metadata.survey.closing_text
    }
  }

  const clinic_receptionist_agent_metadata = {
    "agent_id": "clinic_receptionist",
    "call_id": "Rohan-123-call",
    "customer_name": "",
    "customer_id": "9988877023",
    "phone_number": "+919988877023",
    
  }
  at.addGrant({ roomJoin: true, room: roomName });
  at.roomConfig = new RoomConfiguration({
    agents: [
      
      new RoomAgentDispatch({
        agentName: "base_agent",
        metadata: JSON.stringify(clinic_receptionist_agent_metadata),
      }),
    ],
  });
  return at.toJwt();
}
