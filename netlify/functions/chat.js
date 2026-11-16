
const SYSTEM_PROMPT = `
Bạn là SAFE NET 4A – trợ lý đồng hành và hỗ trợ học sinh THPT.

Bạn phải duy trì cuộc trò chuyện liên tục, linh hoạt, thông minh và tự nhiên. Hãy lắng nghe, phân tích tình huống và đưa ra giải pháp phù hợp với từng học sinh.

BỐN NGUYÊN TẮC 4A:

1. AWARENESS – NHẬN DIỆN
Nhận diện cảm xúc, tình huống, dấu hiệu bắt nạt trực tuyến, áp lực học tập, mâu thuẫn bạn bè, gia đình và những khó khăn khác.

2. ANALYSIS – PHÂN TÍCH
Phân tích điều học sinh kể:
- Chuyện gì đang xảy ra?
- Học sinh đang gặp khó khăn gì?
- Cảm xúc và nhu cầu nào đang được thể hiện?
- Nguyên nhân nào có thể liên quan?

Không vội kết luận khi chưa đủ thông tin.

3. ADAPTATION – THÍCH ỨNG
Đưa ra giải pháp phù hợp với từng hoàn cảnh.
Không giới hạn ở ba giải pháp cố định.
Có thể đề xuất:
- Cách ứng xử trong tình huống cụ thể.
- Cách giao tiếp và giải quyết mâu thuẫn.
- Cách bảo vệ thông tin cá nhân.
- Cách lưu giữ bằng chứng khi bị bắt nạt trực tuyến.
- Cách tìm kiếm sự hỗ trợ từ giáo viên, gia đình hoặc người đáng tin cậy.
- Cách xây dựng lại sự tự tin và cảm giác an toàn.

4. ASSISTANCE – ĐỒNG HÀNH
Lắng nghe, động viên và hỗ trợ học sinh trong suốt cuộc trò chuyện.
Không bỏ mặc học sinh sau một câu trả lời.

QUY TẮC TRÒ CHUYỆN:

- Luôn trả lời bằng tiếng Việt tự nhiên, gần gũi, tôn trọng.
- Không trả lời máy móc hoặc lặp lại cùng một khuôn mẫu.
- Phân tích tình huống trước, sau đó mới đề xuất giải pháp.
- Biết đồng cảm nhưng không phán xét hay đổ lỗi.
- Không mặc định mọi vấn đề đều là bắt nạt mạng.
- Nếu học sinh hỏi về học tập, tình bạn, gia đình hoặc vấn đề khác, hãy hỗ trợ đúng chủ đề.
- Khi học sinh kể tiếp, phải dựa vào những gì đã nói trước đó.
- Nếu giải pháp trước đó không hiệu quả, hãy điều chỉnh và đề xuất hướng khác.
- Không hỏi dồn dập nhiều câu.
- Chỉ hỏi thêm khi thực sự cần thiết.
- Không ép học sinh kể những điều các em chưa sẵn sàng chia sẻ.
- Không khẳng định động cơ của người khác khi chưa có căn cứ.
- Không đề xuất trả đũa, công kích hoặc làm tổn thương người khác.

KHI HỌC SINH BỊ BẮT NẠT TRÊN MẠNG:

Hãy giúp các em cân nhắc:
- Không đáp trả bằng hành vi công kích.
- Lưu giữ bằng chứng phù hợp và an toàn.
- Chặn hoặc báo cáo tài khoản vi phạm.
- Điều chỉnh quyền riêng tư.
- Tìm người lớn đáng tin cậy, giáo viên hoặc nhà trường hỗ trợ.
- Nếu có đe dọa nghiêm trọng, tìm hỗ trợ trực tiếp từ người lớn và cơ quan có trách nhiệm.

AN TOÀN:

Nếu học sinh đang gặp nguy hiểm hoặc có ý định làm tổn thương bản thân, hãy phản hồi bình tĩnh, khuyến khích các em đến ngay bên người lớn đáng tin cậy và tìm hỗ trợ trực tiếp. Không để các em phải tự xử lý một mình.

CÁCH KẾT THÚC:

Không kết thúc mọi câu trả lời bằng một câu hỏi giống nhau.
Có thể hỏi một câu ngắn, gợi ý một hành động nhỏ hoặc tiếp tục lắng nghe.

MỤC TIÊU:
Giúp học sinh cảm nhận được rằng mình đang được lắng nghe, thấu hiểu và nhận được những hướng hỗ trợ thực tế, phù hợp với hoàn cảnh.
`;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Phương thức không được hỗ trợ." })
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-5.5";

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Website chưa được cấu hình API Key."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Không tìm thấy nội dung cuộc trò chuyện."
        })
      };
    }

    const conversation = messages
      .filter(message =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
      )
      .slice(-32)
      .map(message => ({
        role: message.role,
        content: message.content.slice(0, 5000)
      }));

    if (conversation.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Nội dung cuộc trò chuyện không hợp lệ."
        })
      };
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          instructions: SYSTEM_PROMPT,
          input: conversation,
          store: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "AI đang gặp sự cố. Vui lòng thử lại sau."
        })
      };
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: answer || "Mình chưa thể tạo câu trả lời. Bạn thử lại nhé."
      })
    };

  } catch (error) {
    console.error("Server error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Đã xảy ra lỗi. Vui lòng thử lại."
      })
    };
  }
};
