'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Calendar, 
  Heart, 
  Palette,
  CheckCircle
} from 'lucide-react';

const availableInterests = [
  'Technology', 'AI & ML', 'Programming', 'Gaming', 'Art & Design',
  'Music', 'Movies & TV', 'Books', 'Sports', 'Fitness',
  'Travel', 'Photography', 'Cooking', 'Science', 'History',
  'Politics', 'Business', 'Entrepreneurship', 'Fashion', 'Beauty',
  'Health & Wellness', 'Meditation', 'Nature', 'Animals', 'Education'
];

interface OnboardingFormProps {
  userId: string;
}

interface FormData {
  username: string;
  displayName: string;
  bio: string;
  dob: string;
  interests: string[];
  persona: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    displayName: '',
    bio: '',
    dob: '',
    interests: [],
    persona: '',
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.username.length >= 3 && formData.displayName.length >= 2;
      case 2:
        return formData.dob !== '';
      case 3:
        return formData.interests.length > 0;
      case 4:
        return true; // Bio and persona are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete onboarding');
      }

      toast.success('Welcome to the community! 🎉');
      router.push('/follow-suggestions');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Let's start with the basics</h2>
              <p className="text-muted-foreground">Choose your username and display name</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-base font-medium">Username *</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  className="mt-2 h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be your unique identifier (@{formData.username || 'username'})
                </p>
              </div>

              <div>
                <Label htmlFor="displayName" className="text-base font-medium">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={(e) => updateFormData('displayName', e.target.value)}
                  className="mt-2 h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This is how others will see your name
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">When were you born?</h2>
              <p className="text-muted-foreground">We need this to ensure you're old enough to use our platform</p>
            </div>

            <div className="max-w-sm mx-auto">
              <Label htmlFor="dob" className="text-base font-medium">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => updateFormData('dob', e.target.value)}
                className="mt-2 h-12 text-lg"
                max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                You must be at least 13 years old to join
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">What interests you?</h2>
              <p className="text-muted-foreground">Select topics you'd like to see and discuss</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Choose your interests *</Label>
                <Badge variant="secondary">
                  {formData.interests.length} selected
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                      formData.interests.includes(interest)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{interest}</span>
                      {formData.interests.includes(interest) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {formData.interests.length === 0 && (
                <p className="text-sm text-destructive text-center">
                  Please select at least one interest to continue
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-muted-foreground">Add a bio and persona to complete your profile</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bio" className="text-base font-medium">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself..."
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="mt-2 min-h-[100px] resize-none"
                  maxLength={160}
                />
                <p className="text-sm text-muted-foreground mt-1 text-right">
                  {formData.bio.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="persona" className="text-base font-medium">Persona (Optional)</Label>
                <Input
                  id="persona"
                  placeholder="Creative soul, Tech enthusiast, Coffee lover..."
                  value={formData.persona}
                  onChange={(e) => updateFormData('persona', e.target.value)}
                  className="mt-2 h-12"
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  A short label that describes your vibe
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to the Community!
          </CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile in just a few steps
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="min-w-[120px] bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="min-w-[120px] bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}