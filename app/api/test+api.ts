export async function GET(request: Request) {
    return Response.json({ message: "Hello from API" });
}

export async function POST(request: Request) {
    const body = await request.json();
    return Response.json({ received: body });
}
