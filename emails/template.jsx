import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export default function EmailTemplate({ userName = "", type = "monthly-report", data = {} }) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report is Here</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Your Monthly Financial Summary</Heading>

            <Text style={styles.text}>Hi {userName},</Text>
            <Text style={styles.text}>
              Here’s a quick summary of your financial activity for <strong>{data?.month}</strong>:
            </Text>

            {/* Main Stats Section */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Income</Text>
                <Text style={styles.heading}>
                  ${data?.stats?.totalIncome?.toFixed(2)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Expenses</Text>
                <Text style={styles.heading}>
                  ${data?.stats?.totalExpenses?.toFixed(2)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Net Balance</Text>
                <Text style={styles.heading}>
                  ${(
                    data?.stats?.totalIncome - data?.stats?.totalExpenses
                  ).toFixed(2)}
                </Text>
              </div>
            </Section>

            {/* Expenses by Category */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.subHeading}>Expenses by Category</Heading>
                {Object.entries(data.stats.byCategory).map(([category, amount]) => (
                  <div key={category} style={styles.row}>
                    <Text style={styles.text}>{category}</Text>
                    <Text style={styles.text}>${amount.toFixed(2)}</Text>
                  </div>
                ))}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights?.length > 0 && (
              <Section style={styles.section}>
                <Heading style={styles.subHeading}>Quantro Insights</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.text}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thanks for choosing Quantro. Stay tuned and keep making confident financial decisions for a brighter future!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Usage Alert</Heading>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You’ve used {data?.percentageUsed?.toFixed(1)}% of your monthly budget.
            </Text>

            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Budget Amount</Text>
                <Text style={styles.heading}>${data?.budgetAmount}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Spent So Far</Text>
                <Text style={styles.heading}>${data?.totalExpenses}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Remaining</Text>
                <Text style={styles.heading}>
                  ${(data?.budgetAmount - data?.totalExpenses).toFixed(2)}
                </Text>
              </div>
            </Section>

            <Text style={styles.footer}>
              Stay mindful and make sure your expenses stay within the limit. Thanks for choosing Quantro!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  section: {
    marginTop: "24px",
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  subHeading: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "16px 0 8px",
  },
  footer: {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center",
    marginTop: "24px",
  },
};
