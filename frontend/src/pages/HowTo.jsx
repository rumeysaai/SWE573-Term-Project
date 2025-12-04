import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function HowTo() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>How to Use The Hive</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page will contain instructions on how to use The Hive platform.</p>
        </CardContent>
      </Card>
    </div>
  );
}

